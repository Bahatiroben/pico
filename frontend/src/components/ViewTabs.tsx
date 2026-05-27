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
      className={`border-b flex ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-950'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <button
        onClick={() => onTabChange('query')}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'query'
            ? 'border-blue-500 text-blue-500'
            : `border-transparent ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`
        }`}
      >
        Query Editor
      </button>
      <button
        onClick={() => onTabChange('table')}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'table'
            ? 'border-blue-500 text-blue-500'
            : `border-transparent ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`
        }`}
      >
        Table Preview
      </button>
      <div className="flex-1" />
      <button
        onClick={onDisconnect}
        className="px-6 py-3 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
