import { Database, Plus, Sun, Moon, Trash2, ChevronDown, Edit2, Check, X } from 'lucide-react';
import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface ConnectionListProps {
  theme: Theme;
  connections: models.Connection[];
  selectedConn: models.Connection | null;
  expandedConn: models.Connection | null;
  editingConn: Partial<models.Connection> | null;
  isEditingConn: boolean;
  selectedColor: string;
  isConnected: boolean;
  onSelectConnection: (conn: models.Connection) => void;
  onNewConnection: () => void;
  onConnect: (conn: models.Connection) => void;
  onDeleteConnection: (id: string, e: React.MouseEvent) => void;
  onToggleTheme: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditingConnChange: (conn: Partial<models.Connection>) => void;
  onColorChange: (color: string) => void;
}

export function ConnectionList({
  theme,
  connections,
  selectedConn,
  expandedConn,
  editingConn,
  isEditingConn,
  selectedColor,
  isConnected,
  onSelectConnection,
  onNewConnection,
  onConnect,
  onDeleteConnection,
  onToggleTheme,
  onEdit,
  onSave,
  onCancel,
  onEditingConnChange,
  onColorChange,
}: ConnectionListProps) {
  const colors = [
    'gray',
    'red',
    'orange',
    'yellow',
    'cyan',
    'green',
    'blue',
    'pink',
    'purple',
  ];
  const colorMap: Record<string, string> = {
    gray: '#808080',
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    cyan: '#06b6d4',
    green: '#10b981',
    blue: '#3b82f6',
    pink: '#ec4899',
    purple: '#a855f7',
  };

  return (
    <div
      className={`w-96 border-r flex flex-col ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-950'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" />
            <span>Pico</span>
          </h1>
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <button
          onClick={onNewConnection}
          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Connection
        </button>
      </div>

      {/* Connections List */}
      <div className="overflow-auto flex-1">
        {connections.length === 0 ? (
          <div
            className={`text-center py-8 px-4 text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            No connections yet
          </div>
        ) : (
          <div
            className="divide-y"
            style={{
              borderColor:
                theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
            }}
          >
            {connections.map((conn) => {
              const isExpanded = expandedConn?.id === conn.id;
              const displayConn = isEditingConn && editingConn && isExpanded ? editingConn : conn;
              const connColor = (displayConn as any)?.color || 'gray';

              return (
                <div key={conn.id}>
                  {/* Connection Header */}
                  <div
                    className={`p-3 transition-colors cursor-pointer ${
                      isConnected && selectedConn?.id === conn.id
                        ? theme === 'dark'
                          ? 'bg-amber-900/20'
                          : 'bg-amber-50'
                        : theme === 'dark'
                        ? 'hover:bg-gray-800/50'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => !isConnected && onSelectConnection(conn)}
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorMap[connColor] || colorMap.gray }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{conn.name}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {conn.user}@{conn.host}:{conn.port}
                          </p>
                        </div>
                      </div>
                      {!isConnected && (
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && !isConnected && (
                    <div
                      className={`border-t ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="p-3 space-y-3">
                        {/* Color Picker */}
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-2">
                            Color
                          </label>
                          <div className="flex gap-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => onColorChange(color)}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${
                                  (displayConn as any)?.color === color
                                    ? 'border-gray-400 scale-110'
                                    : 'border-transparent'
                                }`}
                                style={{ backgroundColor: colorMap[color] }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Connection Details */}
                        {isEditingConn ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-500">
                                Host
                              </label>
                              <input
                                type="text"
                                value={displayConn?.host || ''}
                                onChange={(e) =>
                                  onEditingConnChange({
                                    ...editingConn,
                                    host: e.target.value,
                                  })
                                }
                                className={`w-full px-2 py-1 rounded text-xs border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500">Port</label>
                              <input
                                type="number"
                                value={displayConn?.port || ''}
                                onChange={(e) =>
                                  onEditingConnChange({
                                    ...editingConn,
                                    port: Number(e.target.value),
                                  })
                                }
                                className={`w-full px-2 py-1 rounded text-xs border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500">User</label>
                              <input
                                type="text"
                                value={displayConn?.user || ''}
                                onChange={(e) =>
                                  onEditingConnChange({
                                    ...editingConn,
                                    user: e.target.value,
                                  })
                                }
                                className={`w-full px-2 py-1 rounded text-xs border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500">
                                Password
                              </label>
                              <input
                                type="password"
                                value={displayConn?.password || ''}
                                onChange={(e) =>
                                  onEditingConnChange({
                                    ...editingConn,
                                    password: e.target.value,
                                  })
                                }
                                className={`w-full px-2 py-1 rounded text-xs border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500">
                                Database
                              </label>
                              <input
                                type="text"
                                value={displayConn?.database || ''}
                                onChange={(e) =>
                                  onEditingConnChange({
                                    ...editingConn,
                                    database: e.target.value,
                                  })
                                }
                                className={`w-full px-2 py-1 rounded text-xs border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs space-y-1">
                            <p>
                              <span className="text-gray-500">Host:</span> {conn.host}:{conn.port}
                            </p>
                            <p>
                              <span className="text-gray-500">User:</span> {conn.user}
                            </p>
                            <p>
                              <span className="text-gray-500">DB:</span> {conn.database}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                          {isEditingConn ? (
                            <>
                              <button
                                onClick={onSave}
                                className="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              >
                                <Check size={14} />
                                Save
                              </button>
                              <button
                                onClick={onCancel}
                                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                }`}
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onConnect(conn)}
                                className="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
                              >
                                Connect
                              </button>
                              <button
                                onClick={onEdit}
                                className={`px-2 py-1.5 rounded text-xs transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                }`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => onDeleteConnection(conn.id, e)}
                                className="px-2 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-600 rounded text-xs transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected State Quick Actions */}
                  {isConnected && selectedConn?.id === conn.id && (
                    <div
                      className={`border-t p-2 ${
                        theme === 'dark'
                          ? 'bg-amber-900/20 border-gray-700'
                          : 'bg-amber-50 border-gray-200'
                      }`}
                    >
                      <p className="text-xs text-amber-700 font-medium">Connected</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
