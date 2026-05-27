import { ChevronDown, ChevronRight, Table as TableIcon } from 'lucide-react';
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
      className={`w-56 border-l ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-950'
          : 'border-gray-200 bg-gray-50'
      } overflow-auto max-h-96`}
    >
      <div
        className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-gray-500">Schemas</p>
      </div>
      <div className="p-4 space-y-2">
        {tree.map((node, idx) => (
          <div key={node.schema}>
            <div
              onClick={() => onToggleSchema(idx)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              {node.isOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              {node.schema}
            </div>
            {node.isOpen &&
              node.tables.map((t) => (
                <div
                  key={t.name}
                  onClick={() => onSelectTable(node.schema, t.name)}
                  className={`ml-4 p-2 rounded cursor-pointer text-sm transition-colors ${
                    selectedTableName === t.name
                      ? 'bg-blue-600/30'
                      : theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <TableIcon size={12} className="inline mr-2" />
                  {t.name}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
