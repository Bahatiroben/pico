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
  QueryEditor,
  TablePreview,
  EmptyState,
} from './components';


function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [connections, setConnections] = useState<models.Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<models.Connection | null>(null);
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
  const [selectedTable, setSelectedTable] = useState<{ schema: string; name: string } | null>(null);
  const [tableData, setTableData] = useState<models.QueryResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM ');
  const [queryResult, setQueryResult] = useState<models.QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // New state for app view: 'connect', 'grid', 'table', 'query'
  const [appView, setAppView] = useState<'connect' | 'table' | 'query'>('connect');
  // Sidebar toggle for table list
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

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


  // Load all schemas/tables for the grid
  const loadDatabaseTree = async (conn: models.Connection) => {
    setConnLoading(true);
    setSelectedConn(conn);
    setTree([]);
    setSelectedTable(null); // No table selected on load
    setTableData(null);
    setQueryResult(null);
    setError('');
    setIsConnected(true);
    setAppView('table'); // Default to table view, but no table selected
    try {
      const schemas = await GetSchemas(conn.id);
      const treeData: TreeNode[] = [];
      for (const schema of schemas) {
        const tables = await GetTables(conn.id, schema);
        treeData.push({ schema, tables, isOpen: true });
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


  // Load a single table for full-screen view
  const loadTable = async (schema: string, tableName: string) => {
    if (!selectedConn) return;
    setSelectedTable({ schema, name: tableName });
    setAppView('table');
    setError('');
    try {
      const result = await GetTableData(selectedConn.id, schema, tableName);
      setTableData(result);
    } catch (err: any) {
      setError('Failed to load table data: ');
      showToast('Failed to load table data', 'error');
    }
  };


  // Run query, then refetch tables when returning to grid
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

  // Intercept window close/unload and navigate back to connections list instead
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (appView !== 'connect') {
        // Prevent the window from closing and navigate back to connections
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
        setAppView('connect');
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [appView]);

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


  // --- Main Render ---
  return (
<div
  className={`
    w-screen h-screen
    flex overflow-hidden
    ${theme === 'dark'
      ? 'bg-gray-900 text-gray-200'
      : 'bg-white text-gray-900'
    }
  `}
>
  {/* CONNECTION VIEW */}
  {appView === 'connect' && (
    <div className="w-full h-full flex">
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
          setShowConnDetails(
            !showConnDetails && selectedConn?.id === conn.id
              ? false
              : true
          );
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
    </div>
  )}

  {/* MAIN APP */}
  {appView !== 'connect' && (
    <div className="flex flex-1 w-full h-full min-w-0 overflow-hidden">
      
      {/* SIDEBAR */}
      {showSidebar && (
        <div className="w-56 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <span className="font-semibold text-xs text-gray-400">
              Tables
            </span>

            <button
              onClick={() => setShowSidebar(false)}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Hide
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {tree.flatMap((node) =>
              node.tables.map((t) => (
                <button
                  key={node.schema + '.' + t.name}
                  onClick={() => loadTable(node.schema, t.name)}
                  className={`
                    w-full text-left px-4 py-2 text-sm truncate
                    ${
                      selectedTable?.name === t.name
                        ? 'bg-amber-900/40 text-amber-200'
                        : 'hover:bg-gray-800 text-gray-300'
                    }
                  `}
                >
                  {t.name}
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-800">
            <button
              onClick={async () => {
                if (selectedConn) await loadDatabaseTree(selectedConn);
              }}
              className="w-full px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white"
            >
              Refresh
            </button>

            <button
              onClick={() => setAppView('query')}
              className="w-full mt-2 px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
            >
              Query Editor
            </button>

            <button
              onClick={() => {
                setIsConnected(false);
                setSelectedConn(null);
                setTree([]);
                setAppView('connect');
              }}
              className="w-full mt-2 px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          
          <div className="min-w-0 truncate">
            {appView === 'table' && selectedTable && (
              <span className="font-semibold text-base text-gray-200">
                {selectedTable.name}
              </span>
            )}

            {appView === 'query' && (
              <span className="font-semibold text-base text-gray-200">
                Query Editor
              </span>
            )}
          </div>

          <div className="ml-auto shrink-0">
            {appView === 'table' && (
              <button
                onClick={() => setAppView('query')}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                Query Editor
              </button>
            )}

            {appView === 'query' && (
              <button
                onClick={() => setAppView('table')}
                className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                Back to Tables
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 w-full min-w-0 min-h-0 overflow-auto">
          
          {appView === 'table' && selectedTable && (
            <div className="w-full h-full">
              <TablePreview
                theme={theme}
                selectedTable={selectedTable}
                tableData={tableData}
              />
            </div>
          )}

          {appView === 'query' && (
            <div className="w-full h-full">
              <QueryEditor
                theme={theme}
                sqlQuery={sqlQuery}
                onQueryChange={setSqlQuery}
                isRunning={isRunning}
                onRunQuery={async () => {
                  await runQuery();
                }}
                error={error}
                queryResult={queryResult}
              />
            </div>
          )}

          {appView === 'table' && !selectedTable && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-lg">
                Select a table from the sidebar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* MODALS */}
  <ConnectionModal
    isOpen={showNewConnModal}
    onClose={() => setShowNewConnModal(false)}
    newConn={newConn}
    setNewConn={setNewConn}
    onTest={handleTestConnection}
    onSave={handleSaveConnection}
    theme={theme}
  />

  <ToastNotifications toasts={toasts} />
</div>
  );
}
export default App;
