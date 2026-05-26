package db

import (
    "context"
    "database/sql"
    "pico/internal/models"
)

func (m *Manager) GetDatabases(pool *sql.DB) ([]string, error) {
    rows, err := pool.QueryContext(context.Background(), `
        SELECT datname FROM pg_database 
        WHERE datistemplate = false 
        ORDER BY datname`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var dbs []string
    for rows.Next() {
        var name string
        rows.Scan(&name)
        dbs = append(dbs, name)
    }
    return dbs, nil
}


func (m *Manager) GetTables(pool *sql.DB, schema string) ([]models.Table, error) {
    query := `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name`

    rows, err := pool.QueryContext(context.Background(), query, schema)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var tables []models.Table
    for rows.Next() {
        var tableName string
        rows.Scan(&tableName)

        tables = append(tables, models.Table{
            Schema: schema,
            Name:   tableName,
        })
    }
    return tables, nil
}