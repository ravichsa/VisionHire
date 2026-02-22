import React from 'react';
import { ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { ColumnConfig, SortConfig } from '../interfaces/data-table.interface';

interface ColumnHeaderProps {
  column: ColumnConfig;
  sortConfig?: SortConfig;
  onSort?: (columnKey: string) => void;
  onFilterClick?: (columnKey: string, element: HTMLElement) => void;
  hasActiveFilter?: boolean;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  sortConfig,
  onSort,
  onFilterClick,
  hasActiveFilter = false,
}) => {
  const isSorted = sortConfig?.column === column.key;
  const sortDirection = isSorted ? sortConfig?.direction : null;

  const handleSortClick = () => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const handleFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (column.filterable && onFilterClick) {
      onFilterClick(column.key, e.currentTarget);
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 ${
        column.sortable ? 'cursor-pointer select-none' : ''
      }`}
      onClick={handleSortClick}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-semibold text-sm text-gray-700 truncate">
          {column.label}
        </span>

        {column.sortable && (
          <div className="flex flex-col gap-0.5">
            <ArrowUp
              className={`w-3 h-3 transition-colors ${
                isSorted && sortDirection === 'asc'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            />
            <ArrowDown
              className={`w-3 h-3 transition-colors ${
                isSorted && sortDirection === 'desc'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            />
          </div>
        )}
      </div>

      {column.filterable && (
        <button
          onClick={handleFilterClick}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            hasActiveFilter ? 'text-blue-600' : 'text-gray-500'
          }`}
          aria-label="Filter column"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
