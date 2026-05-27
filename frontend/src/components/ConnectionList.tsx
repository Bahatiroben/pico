import { Database, Plus, Sun, Moon, Trash2 } from 'lucide-react';
import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface ConnectionListProps {
  theme: Theme;
  connections: models.Connection[];
  selectedConn: models.Connection | null;
  onSelectConnection: (conn: models.Connection) => void;
  onNewConnection: () => void;
  onEditConnection: (conn: models.Connection) => void;
  onConnect: (conn: models.Connection) => void;
  onDeleteConnection: (id: string, e: React.MouseEvent) => void;
  onToggleTheme: () => void;
}

export function ConnectionList({
  theme,
  connections,
  selectedConn,
  onSelectConnection,
  onNewConnection,
  onEditConnection,
  onConnect,
  onDeleteConnection,
  onToggleTheme,
}: ConnectionListProps) {
  return (
    <div
      className={`w-80 border-r flex flex-col ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-950'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            <span>Pico</span>
          </h1>
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <button
          onClick={onNewConnection}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Favorite
        </button>
      </div>

      {/* Connections List */}
      <div className="overflow-auto flex-1">
        {connections.length === 0 ? (
          <div
            className={`text-center py-12 px-4 text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            No connections yet. Create one to get started.
          </div>
        ) : (
          <div
            className="divide-y"
            style={{
              borderColor:
                theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
            }}
          >
            {connections.map((conn) => (
              <div
                key={conn.id}
                className={`p-4 transition-colors ${
                  selectedConn?.id === conn.id
                    ? theme === 'dark'
                      ? 'bg-gray-800'
                      : 'bg-blue-50'
                    : theme === 'dark'
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    onClick={() => onSelectConnection(conn)}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="font-semibold text-sm">{conn.name}</h3>
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {conn.user}@{conn.host}:{conn.port}/{conn.database}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditConnection(conn)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    } text-gray-900 dark:text-white`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onConnect(conn)}
                    className="flex-1 py-1.5 px-3 text-xs font-medium rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    Connect
                  </button>
                  <button
                    onClick={(e) => onDeleteConnection(conn.id, e)}
                    className={`py-1.5 px-2 text-xs font-medium rounded transition-colors ${
                      theme === 'dark'
                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                        : 'bg-red-100 hover:bg-red-200 text-red-600'
                    }`}
                    title="Delete connection"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
