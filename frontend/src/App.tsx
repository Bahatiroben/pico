import { useState, useEffect } from 'react';
import { Database, Plus, Play, Table } from 'lucide-react';
import { GetConnections, TestConnection, SaveConnection } from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';

function App() {
  const [connections, setConnections] = useState<models.Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<models.Connection | null>(null);
  const [showNewConnModal, setShowNewConnModal] = useState(false);

  const [newConn, setNewConn] = useState<Partial<models.Connection>>({
    name: '',
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'postgres',
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await GetConnections();
    setConnections(conns);
  };

  const handleTestConnection = async () => {
    if (!newConn) return;
    const result = await TestConnection(newConn as models.Connection);
    alert(result === "success" ? "✅ Connection successful!" : `❌ ${result}`);
  };

  const handleSaveConnection = async () => {
    if (!newConn.name) return alert("Name is required");
    await SaveConnection(newConn as models.Connection);
    setShowNewConnModal(false);
    loadConnections();
    setNewConn({ name: '', host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'postgres' });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Pico
          </h1>
          <button
            onClick={() => setShowNewConnModal(true)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <div className="text-xs uppercase text-gray-500 mb-2 px-2">Connections</div>
          {connections.map((conn) => (
            <div
              key={conn.ID}
              onClick={() => setSelectedConn(conn)}
              className={`px-3 py-2 rounded cursor-pointer flex items-center gap-2 hover:bg-gray-800 ${selectedConn?.ID === conn.ID ? 'bg-gray-800' : ''}`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-sm">{conn.name}</div>
                <div className="text-xs text-gray-500">{conn.host}:{conn.port}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConn ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a connection or create a new one
          </div>
        ) : (
          <div className="flex-1 p-4">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-medium">{selectedConn.name}</h2>
              <div className="text-sm text-gray-500">
                {selectedConn.host}:{selectedConn.port} / {selectedConn.database}
              </div>
            </div>

            {/* Placeholder for Tree + Editor + Grid */}
            <div className="text-center text-gray-400 py-20">
              <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tree view + SQL Editor + Data Grid coming next</p>
            </div>
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      {showNewConnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">New Connection</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Connection Name"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                value={newConn.name}
                onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Host"
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  value={newConn.host}
                  onChange={(e) => setNewConn({ ...newConn, host: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Port"
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  value={newConn.port}
                  onChange={(e) => setNewConn({ ...newConn, port: parseInt(e.target.value) })}
                />
              </div>

              <input
                type="text"
                placeholder="User"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                value={newConn.user}
                onChange={(e) => setNewConn({ ...newConn, user: e.target.value })}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                value={newConn.password}
                onChange={(e) => setNewConn({ ...newConn, password: e.target.value })}
              />

              <input
                type="text"
                placeholder="Database"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                value={newConn.database}
                onChange={(e) => setNewConn({ ...newConn, database: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTestConnection}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
              >
                Test
              </button>
              <button
                onClick={handleSaveConnection}
                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewConnModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;