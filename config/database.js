const path = require('path');

// Database configuration
const config = {
    development: {
        database: path.join(__dirname, '..', 'data', 'guests.db'),
        options: {
            verbose: true,
            busyTimeout: 30000,
            pragma: {
                journal_mode: 'WAL',
                foreign_keys: 'ON',
                synchronous: 'NORMAL',
                temp_store: 'MEMORY',
                mmap_size: 268435456 // 256MB
            }
        }
    },
    production: {
        database: path.join(__dirname, '..', 'data', 'eventos.db') // Cambiado de guests.db
        options: {
            verbose: false,
            busyTimeout: 30000,
            pragma: {
                journal_mode: 'WAL',
                foreign_keys: 'ON',
                synchronous: 'NORMAL',
                temp_store: 'MEMORY',
                mmap_size: 268435456 // 256MB
            }
        }
    },
    test: {
        database: ':memory:',
        options: {
            verbose: false,
            busyTimeout: 5000,
            pragma: {
                journal_mode: 'MEMORY',
                foreign_keys: 'ON',
                synchronous: 'OFF'
            }
        }
    }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = {
    ...config[environment],
    environment
};
