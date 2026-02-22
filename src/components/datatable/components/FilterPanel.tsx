import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, X } from 'lucide-react';
import {
  ColumnConfig,
  TextFilter,
  NumberFilter,
  DateFilter,
  FilterOption,
  FilterPanelApplyEvent,
} from '../interfaces/data-table.interface';

interface FilterPanelProps {
  column: ColumnConfig;
  data: any[];
  onApply: (event: FilterPanelApplyEvent) => void;
  onClose: () => void;
  position: { top: number; left: number };
  currentFilter?: FilterPanelApplyEvent;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  column,
  data,
  onApply,
  onClose,
  position,
  currentFilter,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'list' | 'text' | 'number' | 'date'>(
    column.type === 'text' ? 'list' : column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'list'
  );

  // List mode state
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Text mode state
  const [textOperator, setTextOperator] = useState<TextFilter['operator']>('contains');
  const [textValue, setTextValue] = useState('');

  // Number mode state
  const [numberOperator, setNumberOperator] = useState<NumberFilter['operator']>('equals');
  const [numberValue, setNumberValue] = useState<number | ''>('');
  const [numberValue2, setNumberValue2] = useState<number | ''>('');

  // Date mode state
  const [dateOperator, setDateOperator] = useState<DateFilter['operator']>('equals');
  const [dateValue, setDateValue] = useState('');
  const [dateValue2, setDateValue2] = useState('');

  useEffect(() => {
    // Initialize options for list mode
    if (mode === 'list') {
      const uniqueValues = new Map<any, number>();
      data.forEach((row) => {
        const value = row[column.key];
        const count = uniqueValues.get(value) || 0;
        uniqueValues.set(value, count + 1);
      });

      const opts: FilterOption[] = Array.from(uniqueValues.entries()).map(([value, count]) => ({
        label: value?.toString() || '(Blank)',
        value,
        count,
        selected: currentFilter?.selectedOptions?.includes(value) ?? true,
      }));

      opts.sort((a, b) => a.label.localeCompare(b.label));
      setOptions(opts);
      setSelectAll(opts.every((opt) => opt.selected));
    }

    // Load current filter
    if (currentFilter) {
      if (currentFilter.textFilter) {
        setMode('text');
        setTextOperator(currentFilter.textFilter.operator);
        setTextValue(currentFilter.textFilter.value);
      } else if (currentFilter.numberFilter) {
        setMode('number');
        setNumberOperator(currentFilter.numberFilter.operator);
        setNumberValue(currentFilter.numberFilter.value ?? '');
        setNumberValue2(currentFilter.numberFilter.value2 ?? '');
      } else if (currentFilter.dateFilter) {
        setMode('date');
        setDateOperator(currentFilter.dateFilter.operator);
        if (currentFilter.dateFilter.value) {
          setDateValue(new Date(currentFilter.dateFilter.value).toISOString().split('T')[0]);
        }
        if (currentFilter.dateFilter.value2) {
          setDateValue2(new Date(currentFilter.dateFilter.value2).toISOString().split('T')[0]);
        }
      }
    }
  }, [column.key, data, mode, currentFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setOptions(options.map((opt) => ({ ...opt, selected: newSelectAll })));
  };

  const handleOptionToggle = (value: any) => {
    const newOptions = options.map((opt) =>
      opt.value === value ? { ...opt, selected: !opt.selected } : opt
    );
    setOptions(newOptions);
    setSelectAll(newOptions.every((opt) => opt.selected));
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApply = () => {
    const event: FilterPanelApplyEvent = {
      column: column.key,
      mode,
    };

    if (mode === 'list') {
      event.selectedOptions = options.filter((opt) => opt.selected).map((opt) => opt.value);
    } else if (mode === 'text') {
      event.textFilter = {
        operator: textOperator,
        value: textValue,
      };
    } else if (mode === 'number') {
      event.numberFilter = {
        operator: numberOperator,
        value: numberValue === '' ? undefined : numberValue,
        value2: numberValue2 === '' ? undefined : numberValue2,
      };
    } else if (mode === 'date') {
      event.dateFilter = {
        operator: dateOperator,
        value: dateValue ? new Date(dateValue) : undefined,
        value2: dateValue2 ? new Date(dateValue2) : undefined,
      };
    }

    onApply(event);
    onClose();
  };

  const handleClear = () => {
    if (mode === 'list') {
      setOptions(options.map((opt) => ({ ...opt, selected: true })));
      setSelectAll(true);
    } else if (mode === 'text') {
      setTextValue('');
    } else if (mode === 'number') {
      setNumberValue('');
      setNumberValue2('');
    } else if (mode === 'date') {
      setDateValue('');
      setDateValue2('');
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg w-80"
      style={{ top: position.top, left: position.left }}
    >
      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200">
        {column.type === 'text' && (
          <>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                mode === 'list'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMode('list')}
            >
              List
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                mode === 'text'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMode('text')}
            >
              Text
            </button>
          </>
        )}
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* List Mode */}
        {mode === 'list' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-b border-gray-200 pb-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <label
                  key={String(option.value)}
                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={option.selected}
                      onChange={() => handleOptionToggle(option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 truncate">{option.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">({option.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Text Mode */}
        {mode === 'text' && (
          <div className="space-y-3">
            <select
              value={textOperator}
              onChange={(e) => setTextOperator(e.target.value as TextFilter['operator'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="notContains">Does Not Contain</option>
              <option value="beginsWith">Begins With</option>
              <option value="endsWith">Ends With</option>
              <option value="notBeginsWith">Does Not Begin With</option>
              <option value="notEndsWith">Does Not End With</option>
            </select>

            <input
              type="text"
              placeholder="Enter value..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Number Mode */}
        {mode === 'number' && (
          <div className="space-y-3">
            <select
              value={numberOperator}
              onChange={(e) => setNumberOperator(e.target.value as NumberFilter['operator'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="greaterThan">Greater Than</option>
              <option value="greaterThanOrEqual">Greater Than or Equal</option>
              <option value="lessThan">Less Than</option>
              <option value="lessThanOrEqual">Less Than or Equal</option>
              <option value="between">Between</option>
              <option value="top10">Top 10</option>
              <option value="bottom10">Bottom 10</option>
              <option value="aboveAverage">Above Average</option>
              <option value="belowAverage">Below Average</option>
            </select>

            {numberOperator !== 'top10' && numberOperator !== 'bottom10' && numberOperator !== 'aboveAverage' && numberOperator !== 'belowAverage' && (
              <>
                <input
                  type="number"
                  placeholder="Enter value..."
                  value={numberValue}
                  onChange={(e) => setNumberValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {numberOperator === 'between' && (
                  <input
                    type="number"
                    placeholder="And..."
                    value={numberValue2}
                    onChange={(e) => setNumberValue2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Date Mode */}
        {mode === 'date' && (
          <div className="space-y-3">
            <select
              value={dateOperator}
              onChange={(e) => setDateOperator(e.target.value as DateFilter['operator'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="before">Before</option>
              <option value="after">After</option>
              <option value="between">Between</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="nextWeek">Next Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="nextMonth">Next Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="lastQuarter">Last Quarter</option>
              <option value="nextQuarter">Next Quarter</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="nextYear">Next Year</option>
              <option value="yearToDate">Year to Date</option>
            </select>

            {['equals', 'notEquals', 'before', 'after', 'between'].includes(dateOperator) && (
              <>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {dateOperator === 'between' && (
                  <input
                    type="date"
                    value={dateValue2}
                    onChange={(e) => setDateValue2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-4 border-t border-gray-200">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Apply
        </button>
        <button
          onClick={handleClear}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
};
