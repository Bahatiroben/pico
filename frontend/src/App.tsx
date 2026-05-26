import { useState, useEffect } from 'react';
import { Database, Plus, Table as TableIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { 
  GetConnections, 
  TestConnection, 
  SaveConnection, 
  GetSchemas, 
  GetTables, 
  GetTableData 
} from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';

interface TreeNode {
  schema: string;
  tables: models.Table[];
  isOpen: boolean;
}

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

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ schema: string; name: string } | null>(null);
  const [tableData, setTableData] = useState<models.QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await GetConnections();
    setConnections(conns);
  };

  const loadDatabaseTree = async (conn: models.Connection) => {
    setSelectedConn(conn);
    setTree([]);
    setSelectedTable(null);
    setTableData(null);

    try {
      const schemas = await GetSchemas(conn.ID);
      const treeData: TreeNode[] = [];

      for (const schema of schemas) {
        const tables = await GetTables(conn.ID, schema);
        treeData.push({ schema, tables, isOpen: schema === 'public' }); // open public by default
      }
      setTree(treeData);
    } catch (err) {
      console.error(err);
      alert("Failed to load database tree");
    }
  };

  const toggleSchema = (index: number) => {
    setTree(prev => prev.map((node, i) => 
      i === index ? { ...node, isOpen: !node.isOpen } : node
    ));
  };

  const loadTable = async (schema: string, tableName: string) => {
    if (!selectedConn) return;
    
    setSelectedTable({ schema, name: tableName });
    setLoading(true);
    
    try {
      const result = await GetTableData(selectedConn.ID, schema, tableName);
      setTableData(result);
    } catch (err) {
      console.error(err);
      alert("Failed to load table data");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!newConn.name) return alert("Please enter a connection name");
    const result = await TestConnection(newConn as models.Connection);
    alert(result === "success" ? "✅ Connection successful!" : `❌ ${result}`);
  };

  const handleSaveConnection = async () => {
    if (!newConn.name) return alert("Connection name is required");
    
    try {
      await SaveConnection(newConn as models.Connection);
      setShowNewConnModal(false);
      loadConnections();
      
      // Reset form
      setNewConn({
        name: '',
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: 'postgres',
      });
    } catch (err) {
      alert("Failed to save connection");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-950">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Pico
          </h1>
          <button
            onClick={() => setShowNewConnModal(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 overflow-auto flex-1">
          <div className="text-xs uppercase text-gray-500 mb-2 px-2">Connections</div>
          {connections.map((conn) => (
            <div
              key={conn.ID}
              onClick={() => loadDatabaseTree(conn)}
              className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2 hover:bg-gray-800 transition-colors ${
                selectedConn?.ID === conn.ID ? 'bg-gray-800' : ''
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <div className="overflow-hidden">
                <div className="text-sm truncate">{conn.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {conn.host}:{conn.port}/{conn.database}
                </div>
              </div>
            </div>
          ))}

          {/* Database Tree */}
          {selectedConn && tree.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase text-gray-500 mb-2 px-2">Explorer</div>
              {tree.map((node, idx) => (
                <div key={node.schema} className="mb-1">
                  <div
                    onClick={() => toggleSchema(idx)}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm font-medium"
                  >
                    {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {node.schema}
                  </div>

                  {node.isOpen &&
                    node.tables.map((t) => (
                      <div
                        key={t.Name}
                        onClick={() => loadTable(node.schema, t.Name)}
                        className={`ml-6 flex items-center gap-2 px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm ${
                          selectedTable?.name === t.Name && selectedTable?.schema === node.schema
                            ? 'bg-gray-800 text-blue-400'
                            : ''
                        }`}
                      >
                        <TableIcon size={16} className="text-amber-400" />
                        {t.Name}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTable && tableData ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-950">
              <h3 className="font-medium">
                {selectedTable.schema}.{selectedTable.name}
                <span className="text-gray-500 text-sm ml-2">
                  {tableData.RowCount} rows
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : (
                <table className="min-w-full border border-gray-700">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr>
                      {tableData.Columns.map((col, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left border-b border-gray-700 text-sm font-medium text-gray-300"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.Rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-800 hover:bg-gray-800/50">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-sm font-mono whitespace-pre"
                          >
                            {cell === null ? <span className="text-gray-500">NULL</span> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {selectedConn ? (
              <div className="text-center">
                <TableIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select a table from the sidebar to view data</p>
              </div>
            ) : (
              <div className="text-center">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select or create a connection to begin</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      {showNewConnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-[420px] p-6">
            <h3 className="text-lg font-semibold mb-5">New PostgreSQL Connection</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Connection Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                value={newConn.name}
                onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Host"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  value={newConn.host}
                  onChange={(e) => setNewConn({ ...newConn, host: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Port"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  value={newConn.port}
                  onChange={(e) => setNewConn({ ...newConn, port: parseInt(e.target.value) || 5432 })}
                />
              </div>

              <input
                type="text"
                placeholder="Username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                value={newConn.user}
                onChange={(e) => setNewConn({ ...newConn, user: e.target.value })}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                value={newConn.password}
                onChange={(e) => setNewConn({ ...newConn, password: e.target.value })}
              />

              <input
                type="text"
                placeholder="Database Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                value={newConn.database}
                onChange={(e) => setNewConn({ ...newConn, database: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleTestConnection}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Test Connection
              </button>
              <button
                onClick={handleSaveConnection}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewConnModal(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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