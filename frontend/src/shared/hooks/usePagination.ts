import { useState } from 'react';

export function usePagination<T>(items: T[], initialPageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    goToPage,
    setPageSize,
  };
}

