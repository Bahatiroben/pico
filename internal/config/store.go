package config

import (
	"encoding/json"
	"os"
	"path/filepath"

	"pico/internal/models"
)

type Store struct {
    path string
}

func NewStore() *Store {
    home, _ := os.UserHomeDir()
    return &Store{
        path: filepath.Join(home, ".pico", "connections.json"),
    }
}

func (s *Store) Save(conns []models.Connection) error {
    os.MkdirAll(filepath.Dir(s.path), 0755)
    data, _ := json.MarshalIndent(conns, "", "  ")
    return os.WriteFile(s.path, data, 0644)
}

func (s *Store) Load() ([]models.Connection, error) {
    data, err := os.ReadFile(s.path)
    if err != nil {
        return []models.Connection{}, nil
    }
    var conns []models.Connection
    json.Unmarshal(data, &conns)
    return conns, nil
}