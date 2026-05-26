import { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Plus, 
  Table as TableIcon, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Trash2, 
  Sun, 
  Moon,
  X,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark');

  const [connections, setConnections] = useState<models.Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<models.Connection | null>(null);
  const [showNewConnModal, setShowNewConnModal] = useState(false);
  const [connLoading, setConnLoading] = useState(false);

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

  const [activeTab, setActiveTab] = useState<ViewTab>('query');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM ');
  const [queryResult, setQueryResult] = useState<models.QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    try {
      const conns = await GetConnections();
      setConnections(conns || []);
    } catch (err) {
      showToast('Failed to load connections', 'error');
    }
  };

  const loadDatabaseTree = async (conn: models.Connection) => {
    setConnLoading(true);
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
      showToast(`Connected to ${conn.name}`, 'success');
    } catch (err: any) {
      setError("Failed to load database structure");
      showToast('Failed to load database structure', 'error');
    } finally {
      setConnLoading(false);
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
      showToast('Failed to load table data', 'error');
    }
  };

  const runQuery = useCallback(async () => {
    if (!selectedConn || !sqlQuery.trim()) {
      showToast('Please enter a query', 'info');
      return;
    }
    
    setIsRunning(true);
    setError('');
    try {
      const result = await ExecuteQuery(selectedConn.id, sqlQuery);
      setQueryResult(result);
      setActiveTab('query');
      showToast(`Query executed: ${result.rowCount} rows`, 'success');
    } catch (err: any) {
      setError(err.message || "Query execution failed");
      showToast(err.message || "Query execution failed", 'error');
    } finally {
      setIsRunning(false);
    }
  }, [selectedConn, sqlQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runQuery]);

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
      showToast('Connection deleted', 'success');
    } catch (err) {
      showToast("Failed to delete connection", 'error');
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await TestConnection(newConn as models.Connection);
      if (result === "success") {
        showToast("Connection successful!", 'success');
      } else {
        showToast(`Connection failed: ${result}`, 'error');
      }
    } catch (err) {
      showToast("Connection test failed", 'error');
    }
  };

  const handleSaveConnection = async () => {
    if (!newConn.name || !newConn.host || !newConn.user) {
      showToast("Please fill in all required fields", 'error');
      return;
    }
    try {
      await SaveConnection(newConn as models.Connection);
      setShowNewConnModal(false);
      loadConnections();
      setNewConn({ name: '', host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'postgres' });
      showToast('Connection saved', 'success');
    } catch (err) {
      showToast("Failed to save connection", 'error');
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'}`}>
      {/* LEFT SIDEBAR - Connections */}
      <div className={`w-64 border-r flex flex-col transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" /> 
            <span>Pico</span>
          </h1>
          
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Connections List */}
        <div className="p-4 overflow-auto flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Connections</span>
            <button 
              onClick={() => setShowNewConnModal(true)} 
              className={`p-1 rounded hover:bg-blue-500/20 text-blue-500 transition-colors`}
              title="New connection"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {connections.length === 0 ? (
            <div className={`text-center py-8 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              No connections. Click + to add one.
            </div>
          ) : (
            connections.map((conn) => (
              <div 
                key={conn.id} 
                onClick={() => loadDatabaseTree(conn)}
                className={`group p-3 rounded-lg cursor-pointer transition-all ${
                  selectedConn?.id === conn.id 
                    ? `${theme === 'dark' ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-blue-100 border border-blue-300'}` 
                    : `${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${selectedConn?.id === conn.id ? 'bg-green-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`} />
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium truncate">{conn.name}</div>
                      <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{conn.host}:{conn.port}</div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteConnection(conn.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${theme === 'dark' ? 'hover:bg-red-900/50' : 'hover:bg-red-200'} text-red-500`}
                    title="Delete connection"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Database Tree */}
          {selectedConn && connLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          ) : selectedConn && tree.length > 0 ? (
            <div className="mt-6 space-y-2">
              <span className="text-xs font-semibold uppercase text-gray-500">Schemas</span>
              {tree.map((node, idx) => (
                <div key={node.schema}>
                  <div 
                    onClick={() => toggleSchema(idx)} 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                  >
                    {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Database size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                    {node.schema}
                  </div>
                  {node.isOpen && (
                    <div className="ml-4 space-y-1">
                      {node.tables.map(t => (
                        <div 
                          key={t.name} 
                          onClick={() => loadTable(node.schema, t.name)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            selectedTable?.name === t.name 
                              ? `${theme === 'dark' ? 'bg-blue-600/30 text-blue-400' : 'bg-blue-100 text-blue-700'}` 
                              : `${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
                          }`}
                        >
                          <TableIcon size={14} className="text-amber-500" />
                          {t.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className={`flex-1 flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {selectedConn ? (
          <>
            {/* Tabs */}
            <div className={`border-b flex ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
              <button 
                onClick={() => setActiveTab('query')} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'query' 
                    ? 'border-blue-500 text-blue-500' 
                    : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                Query Editor
              </button>
              <button 
                onClick={() => setActiveTab('table')} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'table' 
                    ? 'border-blue-500 text-blue-500' 
                    : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                Table Preview
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className={`flex items-center gap-2 px-4 py-3 text-sm ${theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Query Editor Tab */}
            {activeTab === 'query' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className={`p-4 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-100'}`}>
                  <button 
                    onClick={runQuery} 
                    disabled={isRunning || !selectedConn}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
                      isRunning || !selectedConn
                        ? 'bg-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Execute
                      </>
                    )}
                  </button>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ⌘⏎ or Ctrl⏎
                  </span>
                </div>

                {/* Editor and Results */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* SQL Editor */}
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none border-b transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-900 text-gray-200 border-gray-700 focus:bg-gray-950' 
                        : 'bg-white text-gray-900 border-gray-200 focus:bg-gray-50'
                    }`}
                    placeholder="SELECT * FROM users LIMIT 100;"
                  />

                  {/* Results */}
                  {queryResult && (
                    <div className={`flex-1 overflow-auto border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                      <div className={`p-4 border-b text-sm ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                        {queryResult.rowCount} row{queryResult.rowCount !== 1 ? 's' : ''} returned
                      </div>
                      <div className="overflow-auto">
                        <table className={`min-w-full border-collapse text-sm ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                          <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <tr>
                              {queryResult.columns.map((col, i) => (
                                <th 
                                  key={i} 
                                  className={`px-4 py-3 text-left font-semibold border-r ${
                                    theme === 'dark' ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
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
                                className={`border-b transition-colors ${
                                  theme === 'dark' 
                                    ? 'border-gray-800 hover:bg-gray-800/50' 
                                    : 'border-gray-100 hover:bg-gray-50'
                                }`}
                              >
                                {row.map((cell, ci) => (
                                  <td 
                                    key={ci} 
                                    className={`px-4 py-2 font-mono border-r ${
                                      theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                    }`}
                                  >
                                    {cell === null ? (
                                      <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>NULL</span>
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
            )}

            {/* Table Preview Tab */}
            {activeTab === 'table' && (
              <div className="flex-1 overflow-auto">
                {selectedTable && tableData ? (
                  <div className="p-4">
                    <h3 className={`font-semibold mb-4 text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {selectedTable.schema}.{selectedTable.name}
                      <span className={`ml-2 text-sm font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({tableData.rowCount} rows)
                      </span>
                    </h3>
                    <div className="overflow-auto border rounded-lg">
                      <table className={`min-w-full border-collapse text-sm ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <tr>
                            {tableData.columns.map((col, i) => (
                              <th 
                                key={i} 
                                className={`px-4 py-3 text-left font-semibold border-r ${
                                  theme === 'dark' ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
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
                              className={`border-b transition-colors ${
                                theme === 'dark' 
                                  ? 'border-gray-800 hover:bg-gray-800/50' 
                                  : 'border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              {row.map((cell, ci) => (
                                <td 
                                  key={ci} 
                                  className={`px-4 py-2 font-mono border-r ${
                                    theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                  }`}
                                >
                                  {cell === null ? (
                                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>NULL</span>
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
                  <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Select a table from the sidebar
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            <Database className={`w-16 h-16 mb-4 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No connection selected
            </p>
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
              Select or create a connection to begin
            </p>
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      {showNewConnModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className={`rounded-2xl w-[450px] p-8 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-300'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">New Connection</h3>
              <button
                onClick={() => setShowNewConnModal(false)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Connection Name *</label>
                <input 
                  type="text" 
                  placeholder="My Database" 
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  } focus:outline-none`}
                  value={newConn.name} 
                  onChange={(e) => setNewConn({...newConn, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Host *</label>
                  <input 
                    type="text" 
                    placeholder="localhost" 
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                        : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } focus:outline-none`}
                    value={newConn.host} 
                    onChange={(e) => setNewConn({...newConn, host: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Port</label>
                  <input 
                    type="number" 
                    placeholder="5432" 
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                        : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } focus:outline-none`}
                    value={newConn.port} 
                    onChange={(e) => setNewConn({...newConn, port: parseInt(e.target.value) || 5432})} 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Username *</label>
                <input 
                  type="text" 
                  placeholder="postgres" 
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  } focus:outline-none`}
                  value={newConn.user} 
                  onChange={(e) => setNewConn({...newConn, user: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  } focus:outline-none`}
                  value={newConn.password} 
                  onChange={(e) => setNewConn({...newConn, password: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Database Name</label>
                <input 
                  type="text" 
                  placeholder="postgres" 
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  } focus:outline-none`}
                  value={newConn.database} 
                  onChange={(e) => setNewConn({...newConn, database: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleTestConnection} 
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Test Connection
              </button>
              <button 
                onClick={handleSaveConnection} 
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
              <button 
                onClick={() => setShowNewConnModal(false)} 
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {toast.type === 'success' && <Check size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;