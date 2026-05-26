package models

type Connection struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Host     string `json:"host"`
    Port     int    `json:"port"`
    User     string `json:"user"`
    Password string `json:"password"`
    Database string `json:"database"`
}

type Column struct {
    Name     string `json:"name"`
    Type     string `json:"type"`
    Nullable bool   `json:"nullable"`
}

type Table struct {
    Schema  string   `json:"schema"`
    Name    string   `json:"name"`
    Columns []Column `json:"columns"`
}

type QueryResult struct {
    Columns []string        `json:"columns"`
    Rows    [][]interface{} `json:"rows"`
    RowCount int            `json:"rowCount"`
}