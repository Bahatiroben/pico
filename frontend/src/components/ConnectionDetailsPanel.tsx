import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

interface ConnectionDetailsPanelProps {
  connection: models.Connection;
  theme: Theme;
  onDone: () => void;
  onConnect: () => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ConnectionDetailsPanel({
  connection,
  theme,
  onDone,
  onConnect,
  selectedColor,
  onColorChange,
}: ConnectionDetailsPanelProps) {
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
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-8">
        {/* Connection Name with Edit Button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{connection.name}</h2>
        </div>

        {/* Nickname Field */}
        <div
          className={`mb-8 pb-8 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <label
            className={`block text-sm font-semibold mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Nickname
          </label>
          <input
            type="text"
            value={connection.name}
            disabled
            className={`w-full px-4 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-gray-800 border border-gray-700 text-gray-200'
                : 'bg-gray-50 border border-gray-300'
            } disabled:opacity-60`}
          />
        </div>

        {/* Color Picker */}
        <div
          className={`mb-8 pb-8 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <label
            className={`block text-sm font-semibold mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Color
          </label>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-blue-500 scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: colorMap[color] }}
              />
            ))}
          </div>
        </div>

        {/* Connection Details Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Host */}
          <div
            className={`pb-8 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Host
            </label>
            <input
              type="text"
              value={connection.host}
              disabled
              className={`w-full px-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-gray-50 border border-gray-300'
              } disabled:opacity-60`}
            />
          </div>

          {/* Port */}
          <div
            className={`pb-8 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Port
            </label>
            <input
              type="number"
              value={connection.port}
              disabled
              className={`w-full px-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-gray-50 border border-gray-300'
              } disabled:opacity-60`}
            />
          </div>

          {/* User */}
          <div
            className={`pb-8 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              User
            </label>
            <input
              type="text"
              value={connection.user}
              disabled
              className={`w-full px-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-gray-50 border border-gray-300'
              } disabled:opacity-60`}
            />
          </div>

          {/* Password */}
          <div
            className={`pb-8 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Password
            </label>
            <input
              type="password"
              value={connection.password}
              disabled
              className={`w-full px-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-gray-50 border border-gray-300'
              } disabled:opacity-60`}
            />
          </div>

          {/* Database */}
          <div
            className={`col-span-2 pb-8 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Database
            </label>
            <input
              type="text"
              value={connection.database}
              disabled
              className={`w-full px-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-gray-50 border border-gray-300'
              } disabled:opacity-60`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex gap-3 mt-8 pt-8 border-t"
          style={{
            borderColor: theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
          }}
        >
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Options
          </button>
          <button
            onClick={onDone}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Done
          </button>
          <button
            onClick={onConnect}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
