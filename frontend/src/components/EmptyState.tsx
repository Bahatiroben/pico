import { Database, Zap } from 'lucide-react';
import type { Theme } from '../types';

interface EmptyStateProps {
  theme: Theme;
}

export function EmptyState({ theme }: EmptyStateProps) {
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
      }`}
    >
      <Database
        className={`w-12 h-12 mb-4 ${
          theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
        }`}
      />
      <p
        className={`text-lg font-semibold mb-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        Ready to query
      </p>
      <p
        className={`text-sm mb-6 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}
      >
        Select a table or write a query to get started
      </p>
      <div
        className={`px-4 py-2 rounded text-xs font-medium flex items-center gap-2 ${
          theme === 'dark'
            ? 'bg-gray-800 text-gray-400'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        <Zap size={14} />
        Cmd+Enter to execute
      </div>
    </div>
  );
}
