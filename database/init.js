const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'eventos.db');

// Ensure data directory exists
function ensureDataDirectory() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
    }
}

// Create guests table schema
const CREATE_GUESTS_TABLE = `
    CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        gender TEXT,
        family TEXT,
        guest_count INTEGER DEFAULT 1,
        expiration_date DATE,
        confirmation BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Create grupos table schema
const CREATE_GRUPOS_TABLE = `
    CREATE TABLE IF NOT EXISTS grupos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL
    )
`;

// Create conceptos table schema
const CREATE_CONCEPTOS_TABLE = `
    CREATE TABLE IF NOT EXISTS conceptos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        subtotal REAL NOT NULL
    )
`;


const CREATE_EXPENSES_TABLE = `
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descripcion TEXT NOT NULL,
        detalle TEXT,
        responsable TEXT,
        monto REAL NOT NULL,
        id_concept INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_concept) REFERENCES conceptos(id)
    )
`;

// Create trigger to update updated_at timestamp
const CREATE_UPDATE_TRIGGER = `
    CREATE TRIGGER IF NOT EXISTS update_guests_updated_at 
    AFTER UPDATE ON guests
    FOR EACH ROW
    BEGIN
        UPDATE guests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
`;

// Default data for grupos
const INSERT_DEFAULT_GRUPOS = `INSERT OR IGNORE INTO grupos (id, nombre) VALUES (1, 'Ceremonia Religiosa')`;

// Insert default conceptos data
const INSERT_DEFAULT_CONCEPTOS = `
    INSERT OR IGNORE INTO conceptos (id, descripcion) VALUES 
    (1, 'Alimentos'),
    (2, 'Transporte'),
    (3, 'Materiales')
`;

// Initialize database
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            ensureDataDirectory();
            
            const db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database:', DB_PATH);
            });

            db.serialize(() => {
                // Create guests table
                db.run(CREATE_GUESTS_TABLE, (err) => {
                    if (err) {
                        console.error('Error creating guests table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Guests table created/verified successfully');
                });

                // Create grupos table
                db.run(CREATE_GRUPOS_TABLE, (err) => {
                    if (err) {
                        console.error('Error creating grupos table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Grupos table created/verified successfully');
                });

                // Create conceptos table
                db.run(CREATE_CONCEPTOS_TABLE, (err) => {
                    if (err) {
                        console.error('Error creating conceptos table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Conceptos table created/verified successfully');
                });

                // Create expenses table
                db.run(CREATE_EXPENSES_TABLE, (err) => {
                    if (err) {
                        console.error('Error creating expenses table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Expenses table created/verified successfully');
                });

                // Create update trigger
                db.run(CREATE_UPDATE_TRIGGER, (err) => {
                    if (err) {
                        console.error('Error creating update trigger:', err);
                        reject(err);
                        return;
                    }
                    console.log('Update trigger created/verified successfully');
                });

                // Insert default grupos data
                db.run(INSERT_DEFAULT_GRUPOS, (err) => {
                    if (err) {
                        console.error('Error inserting default grupos:', err);
                    } else {
                        console.log('Default grupos data inserted/verified successfully');
                    }
                });

                // Insert default conceptos data
                db.run(INSERT_DEFAULT_CONCEPTOS, (err) => {
                    if (err) {
                        console.error('Error inserting default conceptos:', err);
                    } else {
                        console.log('Default conceptos data inserted/verified successfully');
                    }
                });
            });

            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                    reject(err);
                    return;
                }
                console.log('Database initialization completed');
                resolve();
            });

        } catch (error) {
            console.error('Database initialization failed:', error);
            reject(error);
        }
    });
}

module.exports = {
    initializeDatabase,
    DB_PATH
};
