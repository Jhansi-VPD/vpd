import React from 'react';
import Button from '../Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total rows across all pages — when provided shows a "Showing X–Y of Z" summary. */
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const safeTotalPages = Math.max(totalPages, 1);
  if (safeTotalPages <= 1 && totalItems === undefined) return null;

  const showRange = totalItems !== undefined && pageSize !== undefined;
  const from = totalItems === 0 ? 0 : (currentPage - 1) * (pageSize || 0) + 1;
  const to = showRange ? Math.min(currentPage * (pageSize || 0), totalItems!) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#2A2A2A] text-xs text-[#A1A1AA]">
      <span>
        {showRange && (
          <>
            Showing{' '}
            <strong className="text-white">
              {from}–{to}
            </strong>{' '}
            of <strong className="text-white">{totalItems}</strong>
            {' · '}
          </>
        )}
        Page <strong className="text-white">{currentPage}</strong> of{' '}
        <strong className="text-white">{safeTotalPages}</strong>
      </span>
      <div className="flex items-center gap-4">
        {showRange && onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#1D1D1D] border border-[#2A2A2A] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
