import { Code2, Table as TableIcon } from 'lucide-react';
import type { ViewTab, Theme } from '../types';

interface ViewTabsProps {
  activeTab: ViewTab;
  theme: Theme;
  onTabChange: (tab: ViewTab) => void;
  onDisconnect: () => void;
}

export function ViewTabs({
  activeTab,
  theme,
  onTabChange,
  onDisconnect,
}: ViewTabsProps) {
  return (
    <div
      className={`border-b flex items-center ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-900'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={() => onTabChange('query')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'query'
              ? `border-amber-600 text-amber-600 ${
                  theme === 'dark' ? 'bg-amber-900/10' : 'bg-amber-50'
                }`
              : `border-transparent ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } hover:text-gray-300`
          }`}
        >
          <Code2 size={16} />
          Query
        </button>
        <button
          onClick={() => onTabChange('table')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'table'
              ? `border-amber-600 text-amber-600 ${
                  theme === 'dark' ? 'bg-amber-900/10' : 'bg-amber-50'
                }`
              : `border-transparent ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } hover:text-gray-300`
          }`}
        >
          <TableIcon size={16} />
          Table
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onDisconnect}
        className={`px-4 py-3 text-sm font-medium mr-2 rounded transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        Disconnect
      </button>
    </div>
  );
}
