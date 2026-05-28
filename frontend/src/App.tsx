import { useState, useEffect, useCallback } from 'react';
import {
  GetConnections,
  TestConnection,
  SaveConnection,
  DeleteConnection,
  GetSchemas,
  GetTables,
  GetTableData,
  ExecuteQuery,
} from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';
import type { ViewTab, Theme, TreeNode, Toast } from './types';
import {
  ToastNotifications,
  ConnectionModal,
  ConnectionList,
  ConnectionDetailsPanel,
  DatabaseTree,
  ViewTabs,
  QueryEditor,
  TablePreview,
  EmptyState,
} from './components';

function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [connections, setConnections] = useState<models.Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<models.Connection | null>(
    null
  );
  const [showNewConnModal, setShowNewConnModal] = useState(false);
  const [showConnDetails, setShowConnDetails] = useState(false);
  const [isEditingConn, setIsEditingConn] = useState(false);
  const [editingConn, setEditingConn] = useState<Partial<models.Connection> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connLoading, setConnLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('gray');

  const [newConn, setNewConn] = useState<Partial<models.Connection>>({
    name: '',
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'postgres',
  });

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedTable, setSelectedTable] = useState<
    { schema: string; name: string } | null
  >(null);
  const [tableData, setTableData] = useState<models.QueryResult | null>(null);

  const [activeTab, setActiveTab] = useState<ViewTab>('query');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM ');
  const [queryResult, setQueryResult] = useState<models.QueryResult | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
      .matches;
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

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    loadConnections();
  }, []);

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
    setIsConnected(true);

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
      setError('Failed to load database structure: ');
      showToast('Failed to load database structure: ' + err, 'error');
      setIsConnected(false);
    } finally {
      setConnLoading(false);
    }
  };

  const toggleSchema = (index: number) => {
    setTree((prev) =>
      prev.map((node, i) =>
        i === index ? { ...node, isOpen: !node.isOpen } : node
      )
    );
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
      setError('Failed to load table data: ');
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
      setError(err.message || 'Query execution failed');
      showToast(err.message || 'Query execution failed', 'error');
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

  const handleDeleteConnection = async (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await DeleteConnection(id);
      if (selectedConn?.id === id) {
        setSelectedConn(null);
        setTree([]);
      }
      loadConnections();
      showToast('Connection deleted', 'success');
    } catch (err) {
      showToast('Failed to delete connection', 'error');
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await TestConnection(newConn as models.Connection);
      if (result === 'success') {
        showToast('Connection successful!', 'success');
      } else {
        showToast(`Connection failed: ${result}`, 'error');
      }
    } catch (err) {
      showToast('Connection test failed', 'error');
    }
  };

  const handleSaveConnection = async () => {
    if (!newConn.name || !newConn.host || !newConn.user) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {

      await SaveConnection(newConn as models.Connection);
      setShowNewConnModal(false);
      loadConnections();
      setNewConn({
        name: '',
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: 'postgres',
      });
      showToast('Connection saved', 'success');
    } catch (err) {
      showToast('Failed to save connection', 'error');
    }
  };

  const handleEditConnection = () => {
    if (selectedConn) {
      setEditingConn({ ...selectedConn });
      setIsEditingConn(true);
    }
  };

  const handleUpdateConnection = async () => {
    if (!editingConn?.name || !editingConn?.host || !editingConn?.user) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      await SaveConnection(editingConn as models.Connection);
      setIsEditingConn(false);
      setEditingConn(null);
      loadConnections();
      setSelectedConn(editingConn as models.Connection);
      showToast('Connection updated', 'success');
    } catch (err) {
      showToast('Failed to update connection', 'error');
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-200'
          : 'bg-white text-gray-900'
      }`}
    >
      {/* Left Sidebar - Connections (Postico-style compact) */}
      <ConnectionList
        theme={theme}
        connections={connections}
        selectedConn={selectedConn}
        expandedConn={showConnDetails ? selectedConn : null}
        editingConn={editingConn}
        isEditingConn={isEditingConn}
        selectedColor={selectedColor}
        isConnected={isConnected}
        onSelectConnection={(conn) => {
          setSelectedConn(conn);
          setIsConnected(false);
          setShowConnDetails(!showConnDetails && selectedConn?.id === conn.id ? false : true);
        }}
        onNewConnection={() => {
          setShowNewConnModal(true);
          setSelectedConn(null);
          setIsConnected(false);
          setShowConnDetails(false);
        }}
        onConnect={loadDatabaseTree}
        onDeleteConnection={handleDeleteConnection}
        onToggleTheme={toggleTheme}
        onEdit={handleEditConnection}
        onSave={handleUpdateConnection}
        onCancel={() => {
          setIsEditingConn(false);
          setEditingConn(null);
        }}
        onEditingConnChange={setEditingConn}
        onColorChange={setSelectedColor}
      />

      {/* Main Area */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
        }`}
      >
        {isConnected && selectedConn ? (
          <>
            {/* Header with connection name and tabs */}
            <div
              className={`border-b ${
                theme === 'dark'
                  ? 'border-gray-700 bg-gray-900'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className={`px-6 py-4 flex items-center justify-between ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <h2 className="text-lg font-semibold">{selectedConn.name}</h2>
                <button
                  onClick={() => {
                    setIsConnected(false);
                    setSelectedConn(null);
                    setTree([]);
                  }}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Disconnect
                </button>
              </div>
              <ViewTabs
                activeTab={activeTab}
                theme={theme}
                onTabChange={setActiveTab}
                onDisconnect={() => {
                  setIsConnected(false);
                  setSelectedConn(null);
                  setTree([]);
                }}
              />
            </div>

            {/* Main content with sidebar and panel */}
            <div className="flex flex-1 overflow-hidden">
              {/* Table list sidebar */}
              {tree.length > 0 && (
                <DatabaseTree
                  tree={tree}
                  selectedTableName={selectedTable?.name || null}
                  theme={theme}
                  onToggleSchema={toggleSchema}
                  onSelectTable={loadTable}
                />
              )}

              {/* Content area */}
              <div className="flex-1 overflow-auto">
                {activeTab === 'query' && (
                  <QueryEditor
                    theme={theme}
                    sqlQuery={sqlQuery}
                    onQueryChange={setSqlQuery}
                    isRunning={isRunning}
                    onRunQuery={runQuery}
                    error={error}
                    queryResult={queryResult}
                  />
                )}

                {activeTab === 'table' && (
                  <TablePreview
                    theme={theme}
                    selectedTable={selectedTable}
                    tableData={tableData}
                  />
                )}

                {activeTab === 'query' && !selectedTable && (
                  <EmptyState theme={theme} />
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState theme={theme} />
        )}
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showNewConnModal}
        onClose={() => setShowNewConnModal(false)}
        newConn={newConn}
        setNewConn={setNewConn}
        onTest={handleTestConnection}
        onSave={handleSaveConnection}
        theme={theme}
      />

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} />
    </div>
  );
}
export default App;
