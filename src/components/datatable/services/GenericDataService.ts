import { DataItem, FilterConfig, SortConfig, PaginationConfig, FilterOption, ColumnConfig, TextFilter, NumberFilter, DateFilter } from '../interfaces/data-table.interface';

function isDateValue(value: any): boolean {
  if (!value) return false;
  const dateStr = String(value);
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-[A-Za-z]{3}-\d{4}$/,
    /^\d{2}:[0-5]\d:[0-5]\d [APap][Mm]$/,
    /^\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} [APap][Mm]$/
  ];
  return datePatterns.some(pattern => pattern.test(dateStr)) || !isNaN(Date.parse(dateStr));
}

function getNestedValue(item: any, key: string): any {
  if (key.includes('.') || key.includes('[')) {
    const keys = key.replace(/\[(\d+)\]/g, '.$1').split('.');
    let value = item;
    for (const k of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[k];
    }
    return value;
  }
  return item[key];
}

export class GenericDataService<T extends DataItem> {
  private originalData: T[] = [];
  private columns: ColumnConfig[] = [];
  private filters: Map<string, FilterConfig> = new Map();
  private sort: SortConfig | null = null;
  private pagination: PaginationConfig = {
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  };
  private search: string = '';

  initialize(data: T[], columns: ColumnConfig[]): void {
    this.originalData = data;
    this.columns = columns;
    this.filters = new Map();
    this.sort = null;
    this.search = '';
    this.pagination = {
      currentPage: 1,
      pageSize: 25,
      totalRecords: data.length
    };
  }

  getColumns(): ColumnConfig[] {
    return this.columns;
  }

  getFilteredData(): T[] {
    let data = [...this.originalData];

    if (this.search) {
      const searchLower = this.search.toLowerCase();
      const isNumericSearch = /^\d+$/.test(this.search);
      const visibleColumns = this.columns.filter(c => c.visible !== false).map(col => col.key);

      data = data.filter(item => {
        for (const key of visibleColumns) {
          const value = getNestedValue(item, key);
          if (value === null || value === undefined) continue;

          let stringValue: string;
          if (typeof value === 'object') {
            stringValue = JSON.stringify(value).toLowerCase();
          } else {
            stringValue = String(value).toLowerCase();
          }

          if (isNumericSearch && stringValue.includes(this.search)) {
            return true;
          }

          if (stringValue.includes(searchLower)) {
            return true;
          }

          if (typeof value === 'boolean') {
            if ((value && (searchLower === 'true' || searchLower === 'active' || searchLower === '✓')) ||
              (!value && (searchLower === 'false' || searchLower === 'inactive' || searchLower === '✗'))) {
              return true;
            }
          }
        }
        return false;
      });
    }

    this.filters.forEach((filter, column) => {
      if (filter.filterType === 'text' && filter.textFilter) {
        data = data.filter(item => {
          const value = String(getNestedValue(item, column)).toLowerCase();
          const filterValue = filter.textFilter!.value.toLowerCase();

          switch (filter.textFilter!.operator) {
            case 'equals': return value === filterValue;
            case 'notEquals': return value !== filterValue;
            case 'beginsWith': return value.startsWith(filterValue);
            case 'notBeginsWith': return !value.startsWith(filterValue);
            case 'endsWith': return value.endsWith(filterValue);
            case 'notEndsWith': return !value.endsWith(filterValue);
            case 'contains': return value.includes(filterValue);
            case 'notContains': return !value.includes(filterValue);
            default: return true;
          }
        });
      } else if (filter.filterType === 'number' && filter.numberFilter) {
        data = data.filter(item => {
          const value = Number(getNestedValue(item, column));
          if (isNaN(value)) return false;

          const nf = filter.numberFilter!;

          switch (nf.operator) {
            case 'equals': return value === nf.value!;
            case 'notEquals': return value !== nf.value!;
            case 'greaterThan': return value > nf.value!;
            case 'greaterThanOrEqual': return value >= nf.value!;
            case 'lessThan': return value < nf.value!;
            case 'lessThanOrEqual': return value <= nf.value!;
            case 'between': return value >= nf.value! && value <= nf.value2!;
            case 'top10': {
              const sorted = [...data].sort((a, b) => Number(getNestedValue(b, column)) - Number(getNestedValue(a, column)));
              const top10Values = sorted.slice(0, 10).map(i => Number(getNestedValue(i, column)));
              return top10Values.includes(value);
            }
            case 'bottom10': {
              const sorted = [...data].sort((a, b) => Number(getNestedValue(a, column)) - Number(getNestedValue(b, column)));
              const bottom10Values = sorted.slice(0, 10).map(i => Number(getNestedValue(i, column)));
              return bottom10Values.includes(value);
            }
            case 'aboveAverage': {
              const avg = data.reduce((sum, i) => sum + Number(getNestedValue(i, column)), 0) / data.length;
              return value > avg;
            }
            case 'belowAverage': {
              const avg = data.reduce((sum, i) => sum + Number(getNestedValue(i, column)), 0) / data.length;
              return value < avg;
            }
            default: return true;
          }
        });
      } else if (filter.filterType === 'date' && filter.dateFilter) {
        data = data.filter(item => {
          const value = getNestedValue(item, column);
          if (!isDateValue(value)) return false;
          const itemDate = new Date(value);
          const df = filter.dateFilter!;

          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          switch (df.operator) {
            case 'equals': return df.value && itemDate.toDateString() === df.value.toDateString();
            case 'notEquals': return df.value && itemDate.toDateString() !== df.value.toDateString();
            case 'before': return df.value && itemDate < df.value;
            case 'after': return df.value && itemDate > df.value;
            case 'between': return df.value && df.value2 && itemDate >= df.value && itemDate <= df.value2;
            case 'today': return itemDate.toDateString() === today.toDateString();
            case 'yesterday': {
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              return itemDate.toDateString() === yesterday.toDateString();
            }
            case 'tomorrow': {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              return itemDate.toDateString() === tomorrow.toDateString();
            }
            case 'thisWeek': {
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              return itemDate >= weekStart && itemDate <= weekEnd;
            }
            case 'thisMonth': return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            case 'thisYear': return itemDate.getFullYear() === now.getFullYear();
            default: return true;
          }
        });
      } else if (filter.filterType === 'list' && filter.listFilter && filter.listFilter.length > 0) {
        data = data.filter(item => {
          const value = getNestedValue(item, column);
          return filter.listFilter!.includes(value);
        });
      }
    });

    if (this.sort) {
      data.sort((a, b) => {
        const aValue = getNestedValue(a, this.sort!.column);
        const bValue = getNestedValue(b, this.sort!.column);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (isDateValue(aValue) && isDateValue(bValue)) {
          comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = (aValue === bValue) ? 0 : aValue ? 1 : -1;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return this.sort!.direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }

  getPaginatedData(): T[] {
    const filtered = this.getFilteredData();
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return filtered.slice(startIndex, startIndex + this.pagination.pageSize);
  }

  applyFilter(column: string, filterType: 'text' | 'number' | 'date' | 'list', filter: TextFilter | NumberFilter | DateFilter | any[]): void {
    const filterConfig: FilterConfig = {
      column,
      type: filterType,
      filter,
      filterType,
    };

    if (filterType === 'text') {
      filterConfig.textFilter = filter as TextFilter;
    } else if (filterType === 'number') {
      filterConfig.numberFilter = filter as NumberFilter;
    } else if (filterType === 'date') {
      filterConfig.dateFilter = filter as DateFilter;
    } else if (filterType === 'list') {
      filterConfig.listFilter = filter as any[];
    }

    this.filters.set(column, filterConfig);
    this.pagination.currentPage = 1;
    this.updatePaginationInfo();
  }

  clearFilter(column: string): void {
    this.filters.delete(column);
    this.updatePaginationInfo();
  }

  clearAllFilters(): void {
    this.filters.clear();
    this.updatePaginationInfo();
  }

  applySort(column: string, direction: 'asc' | 'desc'): void {
    this.sort = { column, direction };
  }

  clearSort(): void {
    this.sort = null;
  }

  setSearch(searchTerm: string): void {
    this.search = searchTerm;
    this.pagination.currentPage = 1;
    this.updatePaginationInfo();
  }

  setPageSize(pageSize: number): void {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.updatePaginationInfo();
  }

  setCurrentPage(page: number): void {
    const filtered = this.getFilteredData();
    const totalPages = Math.ceil(filtered.length / this.pagination.pageSize);
    this.pagination.currentPage = Math.max(1, Math.min(page, totalPages));
  }

  getPagination(): PaginationConfig {
    return { ...this.pagination };
  }

  private updatePaginationInfo(): void {
    const filtered = this.getFilteredData();
    this.pagination.totalRecords = filtered.length;
    this.pagination.totalPages = Math.ceil(filtered.length / this.pagination.pageSize);
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }
  }

  getActiveFilters(): Map<string, any> {
    return new Map(this.filters);
  }

  getTotalRecords(): number {
    return this.originalData.length;
  }

  getFilterOptions(column: string): FilterOption[] {
    const values = new Map<any, number>();

    this.originalData.forEach(item => {
      const value = getNestedValue(item, column);
      const count = values.get(value) || 0;
      values.set(value, count + 1);
    });

    const options: FilterOption[] = [];
    values.forEach((count, value) => {
      const label = value === null || value === undefined || value === '' ? '(Blank)' : String(value);
      const selected = false;
      options.push({ label, value, count, selected });
    });

    return options.sort((a, b) => {
      if (a.label === '(Blank)') return 1;
      if (b.label === '(Blank)') return -1;
      return a.label.localeCompare(b.label);
    });
  }
}
