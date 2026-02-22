import React, { useRef, useEffect, useState } from 'react';
import { Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react';
import { ColumnConfig } from '../interfaces/data-table.interface';

interface SettingsProps {
  columns: ColumnConfig[];
  showTotals: boolean;
  onColumnVisibilityChange: (columnKey: string, visible: boolean) => void;
  onShowTotalsChange: (show: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  columns,
  showTotals,
  onColumnVisibilityChange,
  onShowTotalsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleColumnsCount = columns.filter((col) => col.visible !== false).length;
  const hasShowTotalColumns = columns.some((col) => col.showTotal);

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Table settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Table Settings</h3>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Column Visibility Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Column Visibility</h4>
                <span className="text-xs text-gray-500">
                  {visibleColumnsCount} of {columns.length} shown
                </span>
              </div>

              <div className="space-y-2">
                {columns.map((column) => {
                  const isVisible = column.visible !== false;
                  const isOnlyVisible = visibleColumnsCount === 1 && isVisible;

                  return (
                    <label
                      key={column.key}
                      className={`flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                        isOnlyVisible ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) => onColumnVisibilityChange(column.key, e.target.checked)}
                          disabled={isOnlyVisible}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-700 truncate">{column.label}</span>
                      </div>
                      {isVisible ? (
                        <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Show Totals Section */}
            {hasShowTotalColumns && (
              <>
                <div className="my-4 border-t border-gray-200"></div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Display Options</h4>

                  <label className="flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-50">
                    <span className="text-sm text-gray-700">Show Totals Row</span>
                    <div className="relative inline-block">
                      <input
                        type="checkbox"
                        checked={showTotals}
                        onChange={(e) => onShowTotalsChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div
                        onClick={() => onShowTotalsChange(!showTotals)}
                        className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors cursor-pointer"
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            showTotals ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500">
              Customize which columns are visible in the table. At least one column must remain visible.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
