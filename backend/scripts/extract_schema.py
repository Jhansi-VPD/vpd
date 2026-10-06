"""Extract the complete database schema from this backend's models.

Outputs (into <backend>/docs/):
  DATABASE_SCHEMA.md   — column-level reference: every table, column, type,
                         null, default, keys, plus relation graph and a list
                         of disconnected (orphan) tables
  DATABASE_SCHEMA.sql  — executable PostgreSQL DDL (CREATE TYPE / CREATE TABLE
                         / CREATE INDEX / ALTER TABLE for cycle FKs)

Notes:
  * `app/__init__.py` imports the full FastAPI app (needs the `supabase`
    package), so we seed a stub package module to load only the models.
  * Exit code 0 only when all generated counts match Base.metadata.

Run:  cd backend && python scripts/extract_schema.py
"""
import copy
import io
import sys
import types
import warnings
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
warnings.filterwarnings("ignore")

# bypass app/__init__.py (pulls routers -> supabase, not installed everywhere)
if "app" not in sys.modules:
    _pkg = types.ModuleType("app")
    _pkg.__path__ = [str(BACKEND / "app")]
    sys.modules["app"] = _pkg

import app.models  # noqa: F401,E402  (registers models on Base)
from app.core.database import Base  # noqa: E402
from sqlalchemy import (  # noqa: E402
    CheckConstraint,
    ForeignKeyConstraint,
    MetaData,
    PrimaryKeyConstraint,
    Table,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql  # noqa: E402
from sqlalchemy.dialects.postgresql import CreateEnumType  # noqa: E402
from sqlalchemy.schema import CreateIndex, CreateTable  # noqa: E402
from sqlalchemy.sql import sqltypes  # noqa: E402

DIALECT = postgresql.dialect()
DOCS = BACKEND / "docs"
OUT_MD = DOCS / "DATABASE_SCHEMA.md"
OUT_SQL = DOCS / "DATABASE_SCHEMA.sql"

TABLES = Base.metadata.tables


def enum_types() -> list:
    seen: dict[str, sqltypes.Enum] = {}
    for t in TABLES.values():
        for c in t.columns:
            if isinstance(c.type, sqltypes.Enum) and c.type.name:
                seen.setdefault(c.type.name, c.type)
    return [seen[k] for k in sorted(seen)]


def fk_edges(t: Table) -> list[tuple[str, str, str]]:
    """(column, target_table, target_fullname) per column-level FK."""
    return [
        (c.name, list(c.foreign_keys)[0].target_fullname.split(".")[0],
         list(c.foreign_keys)[0].target_fullname)
        for c in t.columns
        if c.foreign_keys
    ]


def topo_sort(graph: dict[str, set[str]]) -> tuple[list[str], list[tuple[str, str]]]:
    remaining = copy.deepcopy(graph)
    order: list[str] = []
    deferred: list[tuple[str, str]] = []
    while remaining:
        ready = sorted(
            n for n, deps in remaining.items()
            if not ((deps - {n}) & remaining.keys())
        )
        if not ready:
            cands = [
                (n, sorted((remaining[n] - {n}) & remaining.keys()))
                for n in sorted(remaining)
            ]
            src, dsts = next((c for c in cands if c[1]), None) or (None, None)
            if src is None:
                raise RuntimeError(f"cannot break cycle among {sorted(remaining)}")
            deferred.append((src, dsts[0]))
            remaining[src].discard(dsts[0])
            continue
        for n in ready:
            order.append(n)
            del remaining[n]
    return order, deferred


# ─────────────────────────── markdown ───────────────────────────

def gen_markdown(order: list[str], deferred: list[tuple[str, str]]) -> str:
    out = io.StringIO()
    w = out.write
    n_fk = sum(len(fk_edges(t)) for t in TABLES.values())
    w("# Database Schema — extracted from this backend\n\n")
    w(f"Generated from `app/models/` via `scripts/extract_schema.py` — "
      f"**{len(TABLES)} tables**, "
      f"**{sum(len(t.columns) for t in TABLES.values())} columns**, "
      f"**{n_fk} foreign keys**, {len(enum_types())} enum types.\n\n")

    # relation graph
    outgoing = {t.name: [d for _, d, _ in fk_edges(t)] for t in TABLES.values()}
    incoming: dict[str, list[str]] = {n: [] for n in TABLES}
    for src, dsts in outgoing.items():
        for d in dsts:
            incoming.setdefault(d, []).append(src)
    disconnected = sorted(
        n for n in TABLES
        if not outgoing[n] and not incoming.get(n)
    )

    w("## Relations (foreign keys)\n\n")
    for src in order:
        if not outgoing[src]:
            continue
        edges = [f"`{d}`" for d in outgoing[src]]
        w(f"- **`{src}`** → " + ", ".join(edges) + "\n")
    w("\n## Disconnected tables (no FK in either direction)\n\n")
    if disconnected:
        w(", ".join(f"`{n}`" for n in disconnected) + "\n\n")
        w("These stand alone: nothing references them and they reference nothing "
          "(they usually link by plain id/UUID columns kept as bare values, "
          "or are standalone reference/CMS data).\n")
    else:
        w("None — every table participates in at least one relation.\n")

    w("\n## Table index\n\n| # | Table | Columns | FKs out | Incoming | Purpose |\n")
    w("|---|-------|---------|---------|----------|---------|\n")
    for i, name in enumerate(order, 1):
        t = TABLES[name]
        w(f"| {i} | `{name}` | {len(t.columns)} | {len(outgoing[name])} "
          f"| {len(incoming.get(name, []))} | |\n")

    w("\n---\n\n## Tables\n")
    for name in order:
        t = TABLES[name]
        w(f"\n### `{name}`\n\n")
        w("| Column | Type | Null | Default | Keys |\n"
          "|--------|------|------|---------|------|\n")
        for c in t.columns:
            keys = []
            if c.primary_key:
                keys.append("PK")
            if c.unique:
                keys.append("UQ")
            if c.index:
                keys.append("IX")
            for fk in c.foreign_keys:
                keys.append(f"FK → `{fk.target_fullname}`")
            d = ""
            if c.default is not None and c.default.arg is not None:
                d = f"`{c.default.arg}`" if not callable(c.default.arg) else "`(func)`"
            if c.server_default is not None:
                d = (d + " " if d else "") + f"server: `{c.server_default.arg}`"
            w(f"| `{c.name}` | {c.type} | {'NO' if not c.nullable else 'YES'} "
              f"| {d} | {', '.join(keys)} |\n")
        for con in t.constraints:
            if con.__class__.__name__ == "UniqueConstraint" and len(con.columns) > 1:
                cols = ", ".join(f"`{c.name}`" for c in con.columns)
                w(f"\n- **UNIQUE** ({cols})" + (f" — `{con.name}`" if con.name else ""))
        if t.indexes:
            w("\n- **Indexes:** " + "; ".join(
                f"`{ix.name}` ({', '.join('`' + c.name + '`' for c in ix.columns)})"
                + (" UNIQUE" if ix.unique else "") for ix in t.indexes))
        w("\n")
    return out.getvalue()


# ──────────────────────────── sql ────────────────────────────

def clone_table(t: Table, shared_md: MetaData) -> Table:
    new = Table(t.name, shared_md)
    for c in t.columns:
        nc = c._copy()
        for fk in list(nc.foreign_keys):
            nc.foreign_keys.remove(fk)
        new.append_column(nc)
    for con in t.constraints:
        if isinstance(con, PrimaryKeyConstraint):
            PrimaryKeyConstraint(*[c.name for c in con.columns],
                                 name=con.name)._set_parent_with_dispatch(new)
        elif isinstance(con, UniqueConstraint):
            UniqueConstraint(*[c.name for c in con.columns],
                             name=con.name)._set_parent_with_dispatch(new)
        elif isinstance(con, CheckConstraint):
            CheckConstraint(con.sqltext, name=con.name)._set_parent_with_dispatch(new)
    return new


def gen_sql(order: list[str], deferred: list[tuple[str, str]]) -> tuple[str, dict]:
    shared = MetaData()
    clones = {name: clone_table(t, shared) for name, t in TABLES.items()}
    deferred_set = set(deferred)

    stmts: list[str] = []
    for typ in enum_types():
        stmts.append(str(CreateEnumType(typ).compile(dialect=DIALECT)) + ";")

    n_inline = 0
    for name in order:
        clone = clones[name]
        for col, dst, target in fk_edges(TABLES[name]):
            if (name, dst) in deferred_set:
                continue
            ForeignKeyConstraint([col], [target])._set_parent(clone)
            n_inline += 1
        stmts.append(str(CreateTable(clone).compile(dialect=DIALECT))
                     .rstrip().rstrip(";") + ";")
        for ix in TABLES[name].indexes:
            stmts.append(str(CreateIndex(ix).compile(dialect=DIALECT)) + ";")

    n_alter = 0
    for src, dst in deferred:
        for col, d, target in fk_edges(TABLES[src]):
            if d != dst:
                continue
            tgt_table, tgt_col = target.split(".")
            con_name = f"fk_{src}_{col}"
            stmts.append(
                f'ALTER TABLE "{src}" ADD CONSTRAINT "{con_name}" '
                f'FOREIGN KEY ("{col}") REFERENCES "{tgt_table}" ("{tgt_col}");')
            n_alter += 1

    total_fk = sum(len(fk_edges(t)) for t in TABLES.values())
    drops = [f"DROP TABLE IF EXISTS {n} CASCADE;" for n in reversed(order)]
    drops += [f"DROP TYPE IF EXISTS {e.name} CASCADE;" for e in enum_types()]
    header = [
        "-- Complete PostgreSQL DDL — extracted from this backend's models",
        f"-- {len(TABLES)} tables, {len(enum_types())} enum types, "
        f"{total_fk} foreign keys ({n_inline} inline + {n_alter} ALTER for cycles), "
        f"{sum(len(t.indexes) for t in TABLES.values())} indexes.",
        "-- Generated by scripts/extract_schema.py — regenerate after model changes.",
        "-- Companion document: docs/DATABASE_SCHEMA.md",
        "",
        "-- To reset the schema, uncomment and run this block:",
        "-- " + "\n-- ".join(drops),
        "",
    ]
    body = ";\n\n".join(s.rstrip().rstrip(";") for s in stmts) + ";\n"

    counts = {
        "tables": sum(1 for s in stmts if s.lstrip().startswith("CREATE TABLE")),
        "types": sum(1 for s in stmts if s.startswith("CREATE TYPE")),
        "indexes": sum(1 for s in stmts
                       if s.startswith(("CREATE INDEX", "CREATE UNIQUE INDEX"))),
        "inline_fk": n_inline,
        "alter_fk": n_alter,
        "total_fk": total_fk,
    }
    return "\n".join(header) + "\n" + body, counts


def main() -> int:
    graph = {t.name: {d for _, d, _ in fk_edges(t)} for t in TABLES.values()}
    order, deferred = topo_sort(graph)

    DOCS.mkdir(exist_ok=True)
    OUT_MD.write_text(gen_markdown(order, deferred), encoding="utf-8")
    sql, c = gen_sql(order, deferred)
    OUT_SQL.write_text(sql, encoding="utf-8")

    exp_idx = sum(len(t.indexes) for t in TABLES.values())
    ok = (
        c["tables"] == len(TABLES)
        and c["types"] == len(enum_types())
        and c["indexes"] == exp_idx
        and c["inline_fk"] + c["alter_fk"] == c["total_fk"]
    )
    print(f"WROTE {OUT_MD}")
    print(f"WROTE {OUT_SQL}")
    print(f"  tables {c['tables']}/{len(TABLES)}, "
          f"types {c['types']}/{len(enum_types())}, "
          f"indexes {c['indexes']}/{exp_idx}, "
          f"FKs {c['inline_fk']}+{c['alter_fk']}={c['total_fk']}")
    print(f"  cycle edges: {deferred}")
    print("  COUNTS:", "OK" if ok else "MISMATCH")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
