package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"pico/internal/config"
	"pico/internal/db"
	"pico/internal/models"
)

type App struct {
	ctx    context.Context
	db     *db.Manager
	config *config.Store
	conns  []models.Connection
	logger *log.Logger
}

func NewApp() *App {
	// Create logs directory if it doesn't exist
	os.MkdirAll("logs", 0755)

	// Create log file
	logFile, err := os.OpenFile("logs/pico.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
	}

	logger := log.New(logFile, "[Pico] ", log.LstdFlags|log.Lshortfile)

	return &App{
		db:     db.NewManager(),
		config: config.NewStore(),
		logger: logger,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.Println("=== Pico Application Starting ===")

	var err error
	a.conns, err = a.config.Load()
	if err != nil {
		a.logger.Printf("Warning: Could not load connections: %v", err)
	} else {
		a.logger.Printf("Successfully loaded %d connection(s)", len(a.conns))
	}
}

// CONNECTIONS 

func (a *App) GetConnections() []models.Connection {
	a.logger.Printf("GetConnections called - returning %d connections", len(a.conns))
	return a.conns
}

func (a *App) TestConnection(conn models.Connection) string {
	a.logger.Printf("TestConnection: testing %s@%s:%d", conn.User, conn.Host, conn.Port)
	err := a.db.TestConnection(conn)
	if err != nil {
		a.logger.Printf("TestConnection FAILED for %s: %v", conn.Name, err)
		return err.Error()
	}
	a.logger.Printf("TestConnection SUCCESS for %s", conn.Name)
	return "success"
}

func (a *App) SaveConnection(conn models.Connection) error {
	a.logger.Printf("SaveConnection: saving connection %s (%s:%d)", conn.Name, conn.Host, conn.Port)

	if conn.ID == "" {
		conn.ID = fmt.Sprintf("conn_%d", len(a.conns)+1)
		a.logger.Printf("Generated new connection ID: %s", conn.ID)
	}

	a.conns = append(a.conns, conn)
	err := a.config.Save(a.conns)
	if err != nil {
		a.logger.Printf("SaveConnection FAILED: %v", err)
		return err
	}

	a.logger.Printf("SaveConnection SUCCESS: %s", conn.Name)
	return nil
}

func (a *App) DeleteConnection(id string) error {
	a.logger.Printf("DeleteConnection: deleting connection %s", id)

	for i, c := range a.conns {
		if c.ID == id {
			a.conns = append(a.conns[:i], a.conns[i+1:]...)
			err := a.config.Save(a.conns)
			if err != nil {
				a.logger.Printf("DeleteConnection FAILED: %v", err)
				return err
			}
			a.logger.Printf("DeleteConnection SUCCESS: %s", id)
			return nil
		}
	}

	a.logger.Printf("DeleteConnection FAILED: connection not found: %s", id)
	return fmt.Errorf("connection not found")
}

// METADATA 

func (a *App) GetDatabases(connID string) ([]string, error) {
	a.logger.Printf("GetDatabases: requesting databases from connection %s", connID)

	if len(a.conns) == 0 {
		a.logger.Println("GetDatabases FAILED: no connections available")
		return nil, fmt.Errorf("no connections")
	}
	conn := a.conns[0]

	pool, err := a.db.GetPool(conn.ID, conn)
	if err != nil {
		a.logger.Printf("GetDatabases FAILED: could not get pool: %v", err)
		return nil, err
	}

	dbs, err := a.db.GetDatabases(pool)
	if err != nil {
		a.logger.Printf("GetDatabases FAILED: %v", err)
		return nil, err
	}

	a.logger.Printf("GetDatabases SUCCESS: found %d databases", len(dbs))
	return dbs, nil
}

func (a *App) GetSchemas(connID string) ([]string, error) {
	start := time.Now()
	a.logger.Printf("GetSchemas: requesting schemas from connection %s", connID)

	if len(a.conns) == 0 {
		a.logger.Println("GetSchemas FAILED: no active connection")
		return nil, fmt.Errorf("no active connection")
	}

	conn := a.conns[0]
	pool, err := a.db.GetPool(conn.ID, conn)
	if err != nil {
		a.logger.Printf("GetSchemas FAILED: could not get pool: %v", err)
		return nil, err
	}

	schemas, err := a.db.GetSchemas(pool)
	if err != nil {
		a.logger.Printf("GetSchemas FAILED: %v", err)
		return nil, err
	}

	duration := time.Since(start).Milliseconds()
	a.logger.Printf("GetSchemas SUCCESS: found %d schemas in %dms", len(schemas), duration)
	return schemas, nil
}

func (a *App) GetTables(connID, schema string) ([]models.Table, error) {
	start := time.Now()
	a.logger.Printf("GetTables: requesting tables from schema %s", schema)

	if len(a.conns) == 0 {
		a.logger.Println("GetTables FAILED: no connections")
		return nil, fmt.Errorf("no connections")
	}
	conn := a.conns[0]

	pool, err := a.db.GetPool(conn.ID, conn)
	if err != nil {
		a.logger.Printf("GetTables FAILED: could not get pool: %v", err)
		return nil, err
	}

	tables, err := a.db.GetTables(pool, schema)
	if err != nil {
		a.logger.Printf("GetTables FAILED for schema %s: %v", schema, err)
		return nil, err
	}

	duration := time.Since(start).Milliseconds()
	a.logger.Printf("GetTables SUCCESS: found %d tables in schema %s (took %dms)", len(tables), schema, duration)
	return tables, nil
}

func (a *App) GetTableData(connID, schema, table string) (*models.QueryResult, error) {
	start := time.Now()
	a.logger.Printf("GetTableData: requesting data from %s.%s", schema, table)

	if len(a.conns) == 0 {
		a.logger.Println("GetTableData FAILED: no active connection")
		return nil, fmt.Errorf("no active connection")
	}
	conn := a.conns[0]

	pool, err := a.db.GetPool(conn.ID, conn)
	if err != nil {
		a.logger.Printf("GetTableData FAILED: could not get pool: %v", err)
		return nil, err
	}

	result, err := a.db.GetTableData(pool, schema, table, 200)
	if err != nil {
		a.logger.Printf("GetTableData FAILED for %s.%s: %v", schema, table, err)
		return nil, err
	}

	duration := time.Since(start).Milliseconds()
	a.logger.Printf("GetTableData SUCCESS: retrieved %d rows from %s.%s (took %dms)", result.RowCount, schema, table, duration)
	return result, nil
}

func (a *App) ExecuteQuery(connID, sqlQuery string) (*models.QueryResult, error) {
	start := time.Now()
	a.logger.Printf("ExecuteQuery: executing query (first 100 chars): %.100s", sqlQuery)

	if len(a.conns) == 0 {
		a.logger.Println("ExecuteQuery FAILED: no active connection")
		return nil, fmt.Errorf("no active connection")
	}
	conn := a.conns[0]

	pool, err := a.db.GetPool(conn.ID, conn)
	if err != nil {
		a.logger.Printf("ExecuteQuery FAILED: could not get pool: %v", err)
		return nil, err
	}

	result, err := a.db.ExecuteQuery(pool, sqlQuery)
	if err != nil {
		a.logger.Printf("ExecuteQuery FAILED: %v", err)
		return nil, err
	}

	duration := time.Since(start).Milliseconds()
	a.logger.Printf("ExecuteQuery SUCCESS: returned %d rows (took %dms)", result.RowCount, duration)
	return result, nil
}
