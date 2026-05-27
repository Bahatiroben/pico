import { Database } from 'lucide-react';
import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface TablePreviewProps {
  theme: Theme;
  selectedTable: { schema: string; name: string } | null;
  tableData: models.QueryResult | null;
}

export function TablePreview({
  theme,
  selectedTable,
  tableData,
}: TablePreviewProps) {
  return (
    <div className="flex-1 overflow-auto p-4">
      {selectedTable && tableData ? (
        <div>
          <h3
            className={`font-semibold mb-4 ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {selectedTable.schema}.{selectedTable.name} ({tableData.rowCount} rows)
          </h3>
          <div className="border rounded-lg overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead
                className={`${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <tr>
                  {tableData.columns.map((col, i) => (
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
                {tableData.rows.map((row, ri) => (
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
      ) : (
        <div
          className={`flex flex-col items-center justify-center h-full ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <Database className="w-12 h-12 mb-2 opacity-50" />
          <p>Select a table from the sidebar</p>
        </div>
      )}
    </div>
  );
}
