package sqlite

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	*sql.DB
}

func New(dbPath string) (*Database, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("error creating database directory: %v", err)
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return nil, fmt.Errorf("error enabling foreign keys: %v", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to the database: %v", err)
	}

	return &Database{DB: db}, nil
}

func (db *Database) getMigrate(migrationsPath string) (*migrate.Migrate, error) {
	driver, err := sqlite3.WithInstance(db.DB, &sqlite3.Config{})
	if err != nil {
		return nil, fmt.Errorf("could not start sql migration: %v", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"sqlite3",
		driver,
	)
	if err != nil {
		return nil, fmt.Errorf("migration failed: %v", err)
	}

	return m, nil
}

func (db *Database) RunMigrations(migrationsPath string) error {
	m, err := db.getMigrate(migrationsPath)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("an error occurred while syncing the database: %v", err)
	}

	return nil
}

func (db *Database) DownMigrations(migrationsPath string) error {
	m, err := db.getMigrate(migrationsPath)
	if err != nil {
		return err
	}

	if err := m.Down(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("an error occurred while downing the database: %v", err)
	}

	return nil
}

func (db *Database) StepMigrations(migrationsPath string, steps int) error {
	m, err := db.getMigrate(migrationsPath)
	if err != nil {
		return err
	}

	if err := m.Steps(steps); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("an error occurred while stepping migrations: %v", err)
	}

	return nil
}
