import { useState, useEffect, useCallback } from 'react';
import { Database, Plus, Table as TableIcon, ChevronRight, ChevronDown, Play, Trash2, Sun, Moon } from 'lucide-react';
import { 
  GetConnections, 
  TestConnection, 
  SaveConnection, 
  DeleteConnection,
  GetSchemas, 
  GetTables, 
  GetTableData,
  ExecuteQuery 
} from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';

interface TreeNode {
  schema: string;
  tables: models.Table[];
  isOpen: boolean;
}

type ViewTab = 'table' | 'query';
type Theme = 'dark' | 'light';

function App() {
  const [theme, setTheme] = useState<Theme>('dark');

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

  const [activeTab, setActiveTab] = useState<ViewTab>('table');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM ');
  const [queryResult, setQueryResult] = useState<models.QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    const conns = await GetConnections();
    setConnections(conns);
  };

  const loadDatabaseTree = async (conn: models.Connection) => {
    setSelectedConn(conn);
    setTree([]);
    setSelectedTable(null);
    setTableData(null);
    setQueryResult(null);
    setError('');

    try {
      const schemas = await GetSchemas(conn.id);
      const treeData: TreeNode[] = [];
      for (const schema of schemas) {
        const tables = await GetTables(conn.id, schema);
        treeData.push({ schema, tables, isOpen: schema === 'public' });
      }
      setTree(treeData);
    } catch (err: any) {
      setError("Failed to load database structure");
    }
  };

  const toggleSchema = (index: number) => {
    setTree(prev => prev.map((node, i) => i === index ? { ...node, isOpen: !node.isOpen } : node));
  };

  const loadTable = async (schema: string, tableName: string) => {
    if (!selectedConn) return;
    setSelectedTable({ schema, name: tableName });
    setActiveTab('table');
    setError('');

    try {
      const result = await GetTableData(selectedConn.id, schema, tableName);
      setTableData(result);
    } catch (err: any) {
      setError("Failed to load table data");
    }
  };

  const runQuery = useCallback(async () => {
    if (!selectedConn || !sqlQuery.trim()) return;
    
    setIsRunning(true);
    setError('');
    try {
      const result = await ExecuteQuery(selectedConn.id, sqlQuery);
      setQueryResult(result);
      setActiveTab('query');
    } catch (err: any) {
      setError(err.message || "Query execution failed");
    } finally {
      setIsRunning(false);
    }
  }, [selectedConn, sqlQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && activeTab === 'query') {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runQuery, activeTab]);

  const handleDeleteConnection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this connection?")) return;
    
    try {
      await DeleteConnection(id);
      if (selectedConn?.id === id) {
        setSelectedConn(null);
        setTree([]);
      }
      loadConnections();
    } catch (err) {
      alert("Failed to delete connection");
    }
  };

  const handleTestConnection = async () => {
    const result = await TestConnection(newConn as models.Connection);
    alert(result === "success" ? "✅ Connection successful!" : `❌ ${result}`);
  };

  const handleSaveConnection = async () => {
    if (!newConn.name) return alert("Connection name is required");
    await SaveConnection(newConn as models.Connection);
    setShowNewConnModal(false);
    loadConnections();
    setNewConn({ name: '', host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'postgres' });
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Sidebar */}
      <div className={`w-72 border-r flex flex-col ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-100'}`}>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" /> Pico
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setShowNewConnModal(true)} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 overflow-auto flex-1">
          <div className="text-xs uppercase text-gray-500 mb-2 px-2">Connections</div>
          {connections.map((conn) => (
            <div 
              key={conn.id} 
              onClick={() => loadDatabaseTree(conn)}
              className={`group px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedConn?.id === conn.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Database className="w-4 h-4 text-emerald-500" />
                <div className="overflow-hidden">
                  <div className="text-sm truncate">{conn.name}</div>
                  <div className="text-xs text-gray-500 truncate">{conn.host}:{conn.port}</div>
                </div>
              </div>
              <button 
                onClick={(e) => handleDeleteConnection(conn.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-500"
              >
                <Trash2 size={14} />
              </button>
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
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer text-sm font-medium"
                  >
                    {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {node.schema}
                  </div>
                  {node.isOpen && node.tables.map(t => (
                    <div 
                      key={t.name} 
                      onClick={() => loadTable(node.schema, t.name)}
                      className={`ml-6 flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer text-sm ${selectedTable?.name === t.name ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    >
                      <TableIcon size={16} className="text-amber-500" />
                      {t.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {selectedConn ? (
          <>
            <div className={`border-b flex ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-white'}`}>
              <button 
                onClick={() => setActiveTab('table')} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'table' ? 'border-blue-500' : 'border-transparent'}`}
              >
                Table Preview
              </button>
              <button 
                onClick={() => setActiveTab('query')} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'query' ? 'border-blue-500' : 'border-transparent'}`}
              >
                SQL Query
              </button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Table Preview Tab */}
            {activeTab === 'table' && (
              <div className="flex-1 overflow-auto p-4">
                {selectedTable && tableData ? (
                  <div>
                    <h3 className="font-medium mb-3">
                      {selectedTable.schema}.{selectedTable.name} — {tableData.rowCount} rows
                    </h3>
                    <table className="min-w-full border border-gray-700 dark:border-gray-700">
                      <thead className="sticky top-0 bg-gray-800 dark:bg-gray-800">
                        <tr>
                          {tableData.columns.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-left text-sm font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-800 dark:border-gray-800 hover:bg-gray-800/50">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-4 py-2 text-sm font-mono">
                                {cell === null ? <span className="text-gray-500">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a table from the sidebar
                  </div>
                )}
              </div>
            )}

            {/* SQL Query Tab */}
            {activeTab === 'query' && (
              <div className="flex-1 flex flex-col">
                <div className={`p-4 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-white'}`}>
                  <button 
                    onClick={runQuery} 
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                  >
                    <Play size={18} /> 
                    {isRunning ? 'Running...' : 'Run Query'}
                  </button>
                  <span className="text-sm text-gray-500">⌘ + Enter</span>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${theme === 'dark' ? 'bg-gray-950 text-gray-200' : 'bg-white text-gray-800'}`}
                  placeholder="SELECT * FROM users LIMIT 100;"
                />

                {queryResult && (
                  <div className="flex-1 overflow-auto p-4 border-t border-gray-700">
                    <h4 className="mb-2 text-sm text-gray-400">
                      {queryResult.rowCount} rows returned
                    </h4>
                    <table className="min-w-full border border-gray-700">
                      <thead className="sticky top-0 bg-gray-800">
                        <tr>
                          {queryResult.columns.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-left text-sm">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-800 hover:bg-gray-800/50">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-4 py-2 text-sm font-mono">
                                {cell === null ? 'NULL' : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select or create a connection to begin
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      {showNewConnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`rounded-xl w-[420px] p-6 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-300'}`}>
            <h3 className="text-lg font-semibold mb-5">New PostgreSQL Connection</h3>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Connection Name" 
                className={`w-full px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                value={newConn.name} 
                onChange={(e) => setNewConn({...newConn, name: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Host" 
                  className={`px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                  value={newConn.host} 
                  onChange={(e) => setNewConn({...newConn, host: e.target.value})} 
                />
                <input 
                  type="number" 
                  placeholder="Port" 
                  className={`px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                  value={newConn.port} 
                  onChange={(e) => setNewConn({...newConn, port: parseInt(e.target.value) || 5432})} 
                />
              </div>
              <input 
                type="text" 
                placeholder="Username" 
                className={`w-full px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                value={newConn.user} 
                onChange={(e) => setNewConn({...newConn, user: e.target.value})} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className={`w-full px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                value={newConn.password} 
                onChange={(e) => setNewConn({...newConn, password: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Database Name" 
                className={`w-full px-4 py-2.5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} 
                value={newConn.database} 
                onChange={(e) => setNewConn({...newConn, database: e.target.value})} 
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleTestConnection} className={`flex-1 py-2.5 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Test</button>
              <button onClick={handleSaveConnection} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Save</button>
              <button onClick={() => setShowNewConnModal(false)} className={`flex-1 py-2.5 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;