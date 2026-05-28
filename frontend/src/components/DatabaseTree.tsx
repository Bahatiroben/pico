import { ChevronDown, ChevronRight, Table as TableIcon, Database } from 'lucide-react';
import type { TreeNode } from '../types';
import type { Theme } from '../types';

interface DatabaseTreeProps {
  tree: TreeNode[];
  selectedTableName: string | null;
  theme: Theme;
  onToggleSchema: (index: number) => void;
  onSelectTable: (schema: string, tableName: string) => void;
}

export function DatabaseTree({
  tree,
  selectedTableName,
  theme,
  onToggleSchema,
  onSelectTable,
}: DatabaseTreeProps) {
  if (tree.length === 0) return null;

  return (
    <div
      className={`w-64 border-l flex flex-col ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-900'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          <Database size={14} className="inline mr-2" />
          Tables
        </p>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-1">
          {tree.map((node, idx) => (
            <div key={node.schema}>
              {/* Schema Header */}
              <button
                onClick={() => onToggleSchema(idx)}
                className={`w-full flex items-center gap-2 p-2 rounded text-sm font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {node.isOpen ? (
                  <ChevronDown size={16} className="flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="flex-shrink-0" />
                )}
                <span className="truncate">{node.schema}</span>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-gray-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {node.tables.length}
                </span>
              </button>

              {/* Tables */}
              {node.isOpen &&
                node.tables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => onSelectTable(node.schema, t.name)}
                    className={`w-full flex items-center gap-2 pl-8 pr-2 py-2 rounded text-sm transition-colors ${
                      selectedTableName === t.name
                        ? theme === 'dark'
                          ? 'bg-amber-900/40 text-amber-200'
                          : 'bg-amber-100 text-amber-900'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800/60'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <TableIcon size={14} className="flex-shrink-0" />
                    <span className="truncate text-left">{t.name}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
