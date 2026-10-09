import React from 'react';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  /** Enables server-side sorting on this column; value is sent to the API as `sort`. */
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
  /** Controlled sort state. Provide together with onSortChange to make headers clickable. */
  sortState?: SortState | null;
  onSortChange?: (sortKey: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Row identity for selection. Falls back to String(row.id). */
  getRowId?: (row: T) => string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'There are currently no records matching your criteria.',
  emptyTitle = 'No Records Found',
  onRowClick,
  sortState,
  onSortChange,
  selectable = false,
  selectedIds,
  onSelectionChange,
  getRowId,
}: DataTableProps<T>) {
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  const rowIdOf = (row: T): string => (getRowId ? getRowId(row) : String(row.id ?? ''));

  const selectionActive = selectable && !!selectedIds && !!onSelectionChange;
  const pageIds = data.map(rowIdOf);
  const selectedOnPage = selectionActive ? pageIds.filter((id) => selectedIds!.has(id)) : [];
  const allSelected = selectionActive && pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const someSelected = !allSelected && selectedOnPage.length > 0;

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleAll = () => {
    if (!selectionActive) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    onSelectionChange!(next);
  };

  const toggleOne = (row: T) => {
    if (!selectionActive) return;
    const next = new Set(selectedIds);
    const id = rowIdOf(row);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange!(next);
  };

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="w-full bg-[#171717] rounded-xl border border-[#2A2A2A]">
        <LoadingState message="Loading data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[#171717] rounded-xl border border-[#2A2A2A] p-4">
        <EmptyState title={emptyTitle} description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#171717] shadow-sm">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-[#111111]/50 pt-24" aria-hidden="true">
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className={`w-full overflow-x-auto ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        <table className="w-full text-left text-sm text-zinc-200 min-w-[600px]">
          <thead className="border-b border-[#2A2A2A] bg-[#141414] text-xs uppercase tracking-wider text-zinc-200 font-semibold">
            <tr>
              {selectionActive && (
                <th className="w-12 px-4 py-3.5">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                    className="h-4 w-4 rounded border-[#2A2A2A] bg-[#1D1D1D] accent-[#D4AF37] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const sortable = !!col.sortKey && !!onSortChange;
                const active = sortable && sortState?.key === col.sortKey;
                return (
                  <th
                    key={idx}
                    className={`px-5 py-3.5 font-semibold ${col.className || ''} ${
                      sortable ? 'cursor-pointer select-none hover:text-zinc-200' : ''
                    }`}
                    aria-sort={active ? (sortState!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                    onClick={sortable ? () => onSortChange!(col.sortKey!) : undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {sortable && (
                        <span className={active ? 'text-[#D4AF37]' : 'text-zinc-600'}>
                          {active && sortState!.direction === 'desc' ? '▼' : '▲'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]/80 bg-[#171717]">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-[#262626] ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectionActive && (
                  <td className="w-12 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds!.has(rowIdOf(row))}
                      onChange={() => toggleOne(row)}
                      aria-label="Select row"
                      className="h-4 w-4 rounded border-[#2A2A2A] bg-[#1D1D1D] accent-[#D4AF37] cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : col.accessor
                      ? (row[col.accessor] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
