import React from 'react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationConfig } from '../interfaces/data-table.interface';

interface PaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  config,
  onPageChange,
  onPageSizeChange,
}) => {
  const { currentPage, pageSize, totalRecords } = config;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Calculate page range to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      const halfWindow = Math.floor(maxPagesToShow / 2);
      let startPage = Math.max(1, currentPage - halfWindow);
      let endPage = Math.min(totalPages, currentPage + halfWindow);

      // Adjust if we're near the start or end
      if (currentPage <= halfWindow) {
        endPage = maxPagesToShow;
      } else if (currentPage >= totalPages - halfWindow) {
        startPage = totalPages - maxPagesToShow + 1;
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add page numbers in range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      {/* Records info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Showing {startRecord} to {endRecord} of {totalRecords.toLocaleString()} records
        </span>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            Show:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="First page"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1.5 text-sm text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  className={`min-w-[2.5rem] px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Last page"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
