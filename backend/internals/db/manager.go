package db

import (
	"context"
	"database/sql"
	"fmt"
	"sync"

	"pico/backend/internal/models"

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

func (m *Manager) TestConnection(conn models.Connection) error {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=prefer",
		conn.User, conn.Password, conn.Host, conn.Port, conn.Database)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5)
	defer cancel()
	return db.PingContext(ctx)
}

func (m *Manager) GetPool(id string, conn models.Connection) (*sql.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if pool, exists := m.pools[id]; exists {
		return pool, nil
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=prefer",
		conn.User, conn.Password, conn.Host, conn.Port, conn.Database)

	pool, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	pool.SetMaxOpenConns(10)
	m.pools[id] = pool
	return pool, nil
}
