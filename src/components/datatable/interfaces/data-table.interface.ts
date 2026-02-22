export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd' | 'dd-MMM-yyyy' | 'HH:mm:ss a';
export type CurrencyFormat = 'USD' | 'INR' | 'EUR';

export interface LinkFormat {
  url: string;
  generateUrl?: (item: DataItem) => string;
}

export interface HighlightColumn {
  type: 'badge' | 'text';
  getValue: (value: any) => string;
  getClass: (value: any) => string;
}

export interface DataItem {
  [key: string]: any;
}

export interface TextFilter {
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'beginsWith' | 'endsWith' | 'notBeginsWith' | 'notEndsWith';
  value: string;
}

export interface NumberFilter {
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
  value?: number;
  value2?: number;
}

export interface DateFilter {
  operator: 'equals' | 'notEquals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate';
  value?: Date;
  value2?: Date;
}

export interface FilterOption {
  label: string;
  value: any;
  count: number;
  selected: boolean;
}

export interface BaseColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  width?: string;
  template?: (item: DataItem) => string;
  link?: LinkFormat;
  highlight?: HighlightColumn;
  showTotal?: boolean;
  mergeRows?: boolean;
}

export interface TextColumnConfig extends BaseColumnConfig {
  type: 'text';
}

export interface NumberColumnConfig extends BaseColumnConfig {
  type: 'number';
  decimalPlaces?: number;
}

export interface BooleanColumnConfig extends BaseColumnConfig {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
}

export interface CurrencyColumnConfig extends BaseColumnConfig {
  type: 'currency';
  format?: CurrencyFormat;
  decimalPlaces?: number;
}

export interface DateColumnConfig extends BaseColumnConfig {
  type: 'date';
  format?: DateFormat;
}

export type ColumnConfig = TextColumnConfig | NumberColumnConfig | BooleanColumnConfig | CurrencyColumnConfig | DateColumnConfig;

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: string;
  type: 'text' | 'number' | 'date' | 'list';
  filter: TextFilter | NumberFilter | DateFilter | any[];
  filterType?: 'text' | 'number' | 'date' | 'list';
  textFilter?: TextFilter;
  numberFilter?: NumberFilter;
  dateFilter?: DateFilter;
  listFilter?: any[];
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages?: number;
}

export interface FilterPanelApplyEvent {
  column: string;
  mode: 'list' | 'text' | 'number' | 'date';
  textFilter?: TextFilter;
  numberFilter?: NumberFilter;
  dateFilter?: DateFilter;
  selectedOptions?: any[];
}

export interface DataTableProps<T extends DataItem> {
  data: T[];
  columns: ColumnConfig[];
  name?: string;
  mergeRowsBy?: string;
  onRowClick?: (row: T) => void;
  onColumnClick?: (row: T, column: ColumnConfig) => void;
  onExportData?: () => void;
}
