package main

import (
    "context"

    "pico/backend/internal/config"
    "pico/backend/internal/db"
    "pico/backend/internal/models"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}



// ==================== WAILS BINDINGS ====================

func (a *App) GetConnections() []models.Connection {
    return a.conns
}

func (a *App) SaveConnection(conn models.Connection) error {
    if conn.ID == "" {
        conn.ID = "conn_" + generateSimpleID() // we'll improve later
    }

    a.conns = append(a.conns, conn)
    return a.config.Save(a.conns)
}

func (a *App) TestConnection(conn models.Connection) string {
    err := a.db.TestConnection(conn)
    if err != nil {
        return err.Error()
    }
    return "success"
}

// Temporary helper - we'll replace with uuid later
func generateSimpleID() string {
    return "id_" + fmt.Sprintf("%d", len(a.conns)+1) // placeholder
}