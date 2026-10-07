import React from 'react';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'There are currently no records matching your criteria.',
  emptyTitle = 'No Records Found',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
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
    <div className="w-full overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#171717] shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
          <thead className="border-b border-[#2A2A2A] bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]/80 bg-[#171717]">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-[#262626] ${onRowClick ? 'cursor-pointer' : ''}`}
              >
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

