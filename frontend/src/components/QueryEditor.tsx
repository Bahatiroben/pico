import { Play, Loader, AlertCircle } from 'lucide-react';
import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface QueryEditorProps {
  theme: Theme;
  sqlQuery: string;
  onQueryChange: (query: string) => void;
  isRunning: boolean;
  onRunQuery: () => void;
  error: string;
  queryResult: models.QueryResult | null;
}

export function QueryEditor({
  theme,
  sqlQuery,
  onQueryChange,
  isRunning,
  onRunQuery,
  error,
  queryResult,
}: QueryEditorProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className={`p-4 border-b flex items-center gap-3 ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-950'
            : 'border-gray-200 bg-gray-100'
        }`}
      >
        <button
          onClick={onRunQuery}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
            isRunning
              ? 'bg-gray-500 opacity-50'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {isRunning ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {isRunning ? 'Running...' : 'Execute'}
        </button>
      </div>

      {error && (
        <div
          className={`flex items-center gap-2 px-4 py-3 text-sm ${
            theme === 'dark'
              ? 'bg-red-900/30 text-red-300'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <textarea
          value={sqlQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none border-b ${
            theme === 'dark'
              ? 'bg-gray-900 text-gray-200 border-gray-700'
              : 'bg-white text-gray-900 border-gray-200'
          }`}
          placeholder="SELECT * FROM users LIMIT 100;"
        />

        {queryResult && (
          <div
            className={`flex-1 overflow-auto border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div
              className={`p-4 border-b text-sm ${
                theme === 'dark'
                  ? 'border-gray-700 text-gray-400'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {queryResult.rowCount} rows
            </div>
            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead
                  className={`sticky top-0 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  <tr>
                    {queryResult.columns.map((col, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-left font-semibold border-r ${
                          theme === 'dark'
                            ? 'border-gray-700'
                            : 'border-gray-200'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`border-b ${
                        theme === 'dark'
                          ? 'border-gray-800 hover:bg-gray-800/50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-4 py-2 font-mono border-r ${
                            theme === 'dark'
                              ? 'border-gray-800'
                              : 'border-gray-100'
                          }`}
                        >
                          {cell === null ? (
                            <span
                              className={
                                theme === 'dark'
                                  ? 'text-gray-500'
                                  : 'text-gray-400'
                              }
                            >
                              NULL
                            </span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
