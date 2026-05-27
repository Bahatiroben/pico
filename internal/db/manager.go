package db

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"pico/internal/models"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Manager struct {
	pools map[string]*sql.DB
	mu    sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		pools: make(map[string]*sql.DB),
	}
}

// buildDSN constructs a PostgreSQL connection string, handling empty passwords
func buildDSN(conn models.Connection) string {
	var dsn string
	if conn.Password != "" {
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
			conn.User, conn.Password, conn.Host, conn.Port, conn.Database)
	} else {
		dsn = fmt.Sprintf("postgres://%s@%s:%d/%s?sslmode=disable",
			conn.User, conn.Host, conn.Port, conn.Database)
	}
	return dsn
}

func (m *Manager) TestConnection(conn models.Connection) error {
	dsn := buildDSN(conn)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.PingContext(ctx)
}

func (m *Manager) GetPool(id string, conn models.Connection) (*sql.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if pool, exists := m.pools[id]; exists {
		return pool, nil
	}

	dsn := buildDSN(conn)

	pool, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	pool.SetMaxOpenConns(10)
	m.pools[id] = pool
	return pool, nil
}

func (m *Manager) GetSchemas(pool *sql.DB) ([]string, error) {
	rows, err := pool.QueryContext(context.Background(), `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schemas []string
	for rows.Next() {
		var name string
		rows.Scan(&name)
		schemas = append(schemas, name)
	}
	return schemas, nil
}

func (m *Manager) GetTableData(pool *sql.DB, schema, table string, limit int) (*models.QueryResult, error) {
	query := fmt.Sprintf(`SELECT * FROM "%s"."%s" LIMIT $1`, schema, table)
	rows, err := pool.QueryContext(context.Background(), query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	colCount := len(columns)

	result := &models.QueryResult{
		Columns: columns,
		Rows:    make([][]interface{}, 0),
	}

	for rows.Next() {
		values := make([]interface{}, colCount)
		scanArgs := make([]interface{}, colCount)
		for i := range values {
			scanArgs[i] = &values[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			continue
		}
		result.Rows = append(result.Rows, values)
	}

	result.RowCount = len(result.Rows)
	return result, nil
}

func (m *Manager) ExecuteQuery(pool *sql.DB, query string) (*models.QueryResult, error) {
	if query == "" {
		return nil, fmt.Errorf("empty query")
	}

	rows, err := pool.QueryContext(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	colCount := len(columns)

	result := &models.QueryResult{
		Columns: columns,
		Rows:    make([][]interface{}, 0),
	}

	for rows.Next() {
		values := make([]interface{}, colCount)
		scanArgs := make([]interface{}, colCount)
		for i := range values {
			scanArgs[i] = &values[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			continue
		}
		result.Rows = append(result.Rows, values)
	}

	result.RowCount = len(result.Rows)
	return result, nil
}
