import { Database } from 'lucide-react';
import type { Theme } from '../types';

interface EmptyStateProps {
  theme: Theme;
}

export function EmptyState({ theme }: EmptyStateProps) {
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <Database
        className={`w-16 h-16 mb-4 ${
          theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
        }`}
      />
      <p
        className={`text-lg font-medium mb-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        No connection selected
      </p>
      <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
        Select a connection from the list to get started
      </p>
    </div>
  );
}
