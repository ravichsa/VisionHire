import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { ColumnConfig, DataItem, FilterPanelApplyEvent, PaginationConfig } from '../interfaces/data-table.interface';
import { GenericDataService } from '../services/GenericDataService';
import { ColumnHeader } from './ColumnHeader';
import { FilterPanel } from './FilterPanel';
import { Pagination } from './Pagination';
import { Settings } from './Settings';
import { DEFAULT_FORMATS } from '../utils/constants';

interface DataTableProps<T extends DataItem = DataItem> {
  data: T[];
  columns: ColumnConfig[];
  name?: string;
  mergeRowsBy?: string;
  onRowClick?: (row: T) => void;
  onColumnClick?: (row: T, column: ColumnConfig) => void;
  onExportData?: () => void;
}

export function DataTable<T extends DataItem = DataItem>({
  data,
  columns,
  name = 'data-table',
  mergeRowsBy = '',
  onRowClick,
  onColumnClick,
  onExportData
}: DataTableProps<T>) {
  const [dataService] = useState(() => new GenericDataService<T>());
  const [displayData, setDisplayData] = useState<T[]>([]);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>({
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  });
  const [activeFilters, setActiveFilters] = useState<Map<string, any>>(new Map());
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [filterPanelColumn, setFilterPanelColumn] = useState<string | null>(null);
  const [filterPanelPosition, setFilterPanelPosition] = useState({ top: 0, left: 0 });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [displayColumns, setDisplayColumns] = useState<ColumnConfig[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showTotals, setShowTotals] = useState(false);
  const [rowMergeEnabled, setRowMergeEnabled] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (data && data.length > 0 && columns && columns.length > 0) {
      const visibleCols = new Set(columns.map(c => c.key));
      setVisibleColumns(visibleCols);
      setDisplayColumns(columns.filter(column => visibleCols.has(column.key)));

      dataService.initialize(data, columns);
      setTotalRecords(dataService.getTotalRecords());
      refreshData();
    }

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [data, columns]);

  useEffect(() => {
    setDisplayColumns(columns.filter(column => visibleColumns.has(column.key)));
  }, [visibleColumns, columns]);

  const refreshData = useCallback(() => {
    const paginated = dataService.getPaginatedData();
    const filtered = dataService.getFilteredData();
    const merged = mergeRows(paginated, displayColumns);

    setDisplayData(merged);
    setFilteredRecords(filtered.length);
    setPaginationConfig(dataService.getPagination());
    setActiveFilters(dataService.getActiveFilters());
  }, [dataService, displayColumns]);

  const mergeRows = (items: T[], displayColumns: ColumnConfig[]): any[] => {
    const rowMerge = columns.some(c => c.mergeRows);
    setRowMergeEnabled(rowMerge);

    if (rowMerge && !mergeRowsBy) {
      console.warn('Row merging is enabled but no mergeRowsBy key is specified.');
      return items;
    }

    if (!items || items.length === 0 || !mergeRowsBy || !rowMerge) {
      return items;
    }

    const mergedData: any[] = [];
    let currentGroupValue: any = null;
    let groupStart = 0;

    items.forEach((item, index) => {
      const groupValue = item[mergeRowsBy];

      if (groupValue !== currentGroupValue) {
        if (currentGroupValue !== null) {
          const rowspan = index - groupStart;
          mergedData[groupStart]._rowspan = {};
          displayColumns.forEach(col => {
            if (col.mergeRows) {
              mergedData[groupStart]._rowspan[col.key] = rowspan;
            }
          });
        }
        currentGroupValue = groupValue;
        groupStart = index;
      }

      mergedData.push({ ...item, _rowspan: {} });
    });

    if (currentGroupValue !== null && items.length > 0) {
      const rowspan = items.length - groupStart;
      mergedData[groupStart]._rowspan = {};
      displayColumns.forEach(col => {
        if (col.mergeRows) {
          mergedData[groupStart]._rowspan[col.key] = rowspan;
        }
      });
    }

    return mergedData;
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      dataService.setSearch(value);
      refreshData();
    }, 1000);
  };

  const handleSort = (column: ColumnConfig) => {
    if (!column.sortable) return;

    let direction: 'asc' | 'desc' | null = 'asc';

    if (sortColumn === column.key) {
      if (sortDirection === 'asc') {
        direction = 'desc';
      } else {
        direction = null;
        setSortColumn(null);
        setSortDirection(null);
        dataService.clearSort();
        refreshData();
        return;
      }
    }

    setSortColumn(column.key);
    setSortDirection(direction);

    if (direction) {
      dataService.applySort(column.key, direction);
    }
    refreshData();
  };

  const handleFilterClick = (column: ColumnConfig, event: React.MouseEvent) => {
    if (!column.filterable) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPanelPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setFilterPanelColumn(column.key);
    setFilterPanelVisible(true);
  };

  const handleFilterApply = (event: FilterPanelApplyEvent) => {
    if (event.mode === 'list' && event.selectedOptions) {
      dataService.applyFilter(event.column, 'list', event.selectedOptions);
    } else if (event.mode === 'text' && event.textFilter) {
      dataService.applyFilter(event.column, 'text', event.textFilter);
    } else if (event.mode === 'number' && event.numberFilter) {
      dataService.applyFilter(event.column, 'number', event.numberFilter);
    } else if (event.mode === 'date' && event.dateFilter) {
      dataService.applyFilter(event.column, 'date', event.dateFilter);
    }
    setFilterPanelVisible(false);
    refreshData();
  };

  const handleFilterClear = (column: string) => {
    dataService.clearFilter(column);
    setFilterPanelVisible(false);
    refreshData();
  };

  const handlePageChange = (page: number) => {
    dataService.setCurrentPage(page);
    refreshData();
  };

  const handlePageSizeChange = (pageSize: number) => {
    dataService.setPageSize(pageSize);
    refreshData();
  };

  const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (visible) {
      newVisibleColumns.add(columnKey);
    } else {
      newVisibleColumns.delete(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const formatValue = (value: any, column: ColumnConfig, item: T): string | React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (column.template) {
      return <span dangerouslySetInnerHTML={{ __html: column.template(item) }} />;
    }

    if (column.link) {
      const url = column.link.generateUrl ? column.link.generateUrl(item) : column.link.url;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
          {String(value)}
        </a>
      );
    }

    switch (column.type) {
      case 'date':
        if (!value) return '-';
        const date = new Date(value);
        const format = column.format || DEFAULT_FORMATS.date;
        return formatDate(date, format);

      case 'currency':
        const currencyFormat = column.format || DEFAULT_FORMATS.currency;
        const decimals = column.decimalPlaces ?? 2;
        return formatCurrency(Number(value), currencyFormat, decimals);

      case 'number':
        const numDecimals = column.decimalPlaces ?? 0;
        return Number(value).toFixed(numDecimals);

      case 'boolean':
        return value ? (column.trueLabel || '✓') : (column.falseLabel || '✗');

      default:
        return searchTerm && String(value).toLowerCase().includes(searchTerm.toLowerCase())
          ? highlightSearchTerm(String(value), searchTerm)
          : String(value);
    }
  };

  const formatDate = (date: Date, format: string): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[date.getMonth()];

    switch (format) {
      case 'dd/MM/yyyy': return `${day}/${month}/${year}`;
      case 'MM/dd/yyyy': return `${month}/${day}/${year}`;
      case 'yyyy-MM-dd': return `${year}-${month}-${day}`;
      case 'dd-MMM-yyyy': return `${day}-${monthName}-${year}`;
      default: return date.toLocaleDateString();
    }
  };

  const formatCurrency = (value: number, format: string, decimals: number): string => {
    const formatted = value.toFixed(decimals);
    switch (format) {
      case 'USD': return `$${formatted}`;
      case 'EUR': return `€${formatted}`;
      case 'INR': return `₹${formatted}`;
      default: return formatted;
    }
  };

  const highlightSearchTerm = (text: string, term: string): React.ReactNode => {
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase()
            ? <mark key={i} className="bg-yellow-200">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const getCellClass = (column: ColumnConfig, value: any): string => {
    if (column.highlight) {
      const customClass = column.highlight.getClass(value);
      return `px-4 py-3 text-sm ${customClass}`;
    }
    return 'px-4 py-3 text-sm text-gray-700';
  };

  const shouldShowCell = (item: any, column: ColumnConfig, rowIndex: number): boolean => {
    if (!item._rowspan || !item._rowspan[column.key]) {
      return rowIndex === 0 || !displayData[rowIndex - 1]?._rowspan?.[column.key];
    }
    return true;
  };

  const getRowSpan = (item: any, column: ColumnConfig): number => {
    return item._rowspan?.[column.key] || 1;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setSettingsVisible(!settingsVisible)}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5 text-gray-600" />
        </button>
        {settingsVisible && (
          <Settings
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            showTotals={showTotals}
            onShowTotalsChange={setShowTotals}
            onClose={() => setSettingsVisible(false)}
          />
        )}
      </div>

      <div ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {displayColumns.map(column => (
                <ColumnHeader
                  key={column.key}
                  column={column}
                  sorted={sortColumn === column.key}
                  sortDirection={sortColumn === column.key ? sortDirection : null}
                  filtered={activeFilters.has(column.key)}
                  onSort={() => handleSort(column)}
                  onFilterClick={(e) => handleFilterClick(column, e)}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
              >
                {displayColumns.map(column =>
                  shouldShowCell(item, column, rowIndex) ? (
                    <td
                      key={column.key}
                      className={getCellClass(column, item[column.key])}
                      rowSpan={getRowSpan(item, column)}
                      onClick={(e) => {
                        if (onColumnClick) {
                          e.stopPropagation();
                          onColumnClick(item, column);
                        }
                      }}
                    >
                      {formatValue(item[column.key], column, item)}
                    </td>
                  ) : null
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200">
        <Pagination
          currentPage={paginationConfig.currentPage}
          pageSize={paginationConfig.pageSize}
          totalRecords={filteredRecords}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {filterPanelVisible && filterPanelColumn && (
        <FilterPanel
          column={columns.find(c => c.key === filterPanelColumn)!}
          dataService={dataService}
          position={filterPanelPosition}
          onApply={handleFilterApply}
          onClear={() => handleFilterClear(filterPanelColumn)}
          onClose={() => setFilterPanelVisible(false)}
        />
      )}
    </div>
  );
}
