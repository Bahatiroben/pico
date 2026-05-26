package main

import (
    "context"
    "fmt"

    "pico/internal/config"
    "pico/internal/db"
    "pico/internal/models"
)

type App struct {
    ctx     context.Context
    db      *db.Manager
    config  *config.Store
    conns   []models.Connection
}

func NewApp() *App {
    return &App{
        db:     db.NewManager(),
        config: config.NewStore(),
    }
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    var err error
    a.conns, err = a.config.Load()
    if err != nil {
        println("Warning: Could not load connections")
    }
}

// ==================== CONNECTIONS ====================

func (a *App) GetConnections() []models.Connection {
    return a.conns
}

func (a *App) TestConnection(conn models.Connection) string {
    err := a.db.TestConnection(conn)
    if err != nil {
        return err.Error()
    }
    return "success"
}

func (a *App) SaveConnection(conn models.Connection) error {
    if conn.ID == "" {
        conn.ID = fmt.Sprintf("conn_%d", len(a.conns)+1)
    }

    a.conns = append(a.conns, conn)
    return a.config.Save(a.conns)
}

func (a *App) DeleteConnection(id string) error {
    for i, c := range a.conns {
        if c.ID == id {
            a.conns = append(a.conns[:i], a.conns[i+1:]...)
            return a.config.Save(a.conns)
        }
    }
    return fmt.Errorf("connection not found")
}

// ==================== METADATA ====================

func (a *App) GetDatabases(connID string) ([]string, error) {
    // TODO: For now we'll use first connection. Improve later.
    if len(a.conns) == 0 {
        return nil, fmt.Errorf("no connections")
    }
    conn := a.conns[0] // temporary

    pool, err := a.db.GetPool(conn.ID, conn)
    if err != nil {
        return nil, err
    }
    return a.db.GetDatabases(pool)
}

func (a *App) GetTables(connID, schema string) ([]models.Table, error) {
    if len(a.conns) == 0 {
        return nil, fmt.Errorf("no connections")
    }
    conn := a.conns[0] // temporary

    pool, err := a.db.GetPool(conn.ID, conn)
    if err != nil {
        return nil, err
    }
    return a.db.GetTables(pool, schema)
}

func (a *App) GetSchemas(connID string) ([]string, error) {
    if len(a.conns) == 0 {
        return nil, fmt.Errorf("no active connection")
    }
    conn := a.conns[0]
    pool, err := a.db.GetPool(conn.ID, conn)
    if err != nil {
        return nil, err
    }
    return a.db.GetSchemas(pool)
}

func (a *App) GetTableData(connID, schema, table string) (*models.QueryResult, error) {
    if len(a.conns) == 0 {
        return nil, fmt.Errorf("no active connection")
    }
    conn := a.conns[0]
    pool, err := a.db.GetPool(conn.ID, conn)
    if err != nil {
        return nil, err
    }
    return a.db.GetTableData(pool, schema, table, 200)
}

func (a *App) ExecuteQuery(connID, sqlQuery string) (*models.QueryResult, error) {
    if len(a.conns) == 0 {
        return nil, fmt.Errorf("no active connection")
    }
    conn := a.conns[0]
    pool, err := a.db.GetPool(conn.ID, conn)
    if err != nil {
        return nil, err
    }
    return a.db.ExecuteQuery(pool, sqlQuery)
}