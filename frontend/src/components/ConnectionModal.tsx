import { X } from 'lucide-react';
import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newConn: Partial<models.Connection>;
  setNewConn: (conn: Partial<models.Connection>) => void;
  onTest: () => void;
  onSave: () => void;
  theme: Theme;
}

export function ConnectionModal({
  isOpen,
  onClose,
  newConn,
  setNewConn,
  onTest,
  onSave,
  theme,
}: ConnectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className={`rounded-2xl w-[450px] p-8 ${
          theme === 'dark'
            ? 'bg-gray-900 border border-gray-700'
            : 'bg-white border border-gray-300'
        } shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">New Connection</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Connection Name *
            </label>
            <input
              type="text"
              placeholder="My Database"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              }`}
              value={newConn.name || ''}
              onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Host *</label>
              <input
                type="text"
                placeholder="localhost"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-300'
                }`}
                value={newConn.host || ''}
                onChange={(e) => setNewConn({ ...newConn, host: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Port</label>
              <input
                type="number"
                placeholder="5432"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-300'
                }`}
                value={newConn.port || 5432}
                onChange={(e) =>
                  setNewConn({ ...newConn, port: parseInt(e.target.value) || 5432 })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Username *</label>
            <input
              type="text"
              placeholder="postgres"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              }`}
              value={newConn.user || ''}
              onChange={(e) => setNewConn({ ...newConn, user: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              }`}
              value={newConn.password || ''}
              onChange={(e) =>
                setNewConn({ ...newConn, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Database Name
            </label>
            <input
              type="text"
              placeholder="postgres"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              }`}
              value={newConn.database || ''}
              onChange={(e) =>
                setNewConn({ ...newConn, database: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={onTest}
            className={`flex-1 py-2.5 rounded-lg ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Test
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-lg ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
