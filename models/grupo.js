const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');

class Grupo {
    // Get database connection
    static getDatabase() {
        return new sqlite3.Database(DB_PATH);
    }

    // Get all grupos
    static async findAll() {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.all('SELECT * FROM grupos ORDER BY nombre ASC', [], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get grupo by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.get('SELECT * FROM grupos WHERE id = ?', [id], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    // Create new grupo
    static async create(grupoData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const { nombre } = grupoData;
            const query = 'INSERT INTO grupos (nombre) VALUES (?)';

            db.run(query, [nombre], function(err) {
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    const insertId = this.lastID;
                    db.close();
                    resolve(insertId);
                }
            });
        });
    }

    // Update grupo by ID
    static async update(id, grupoData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const { nombre } = grupoData;
            
            if (!nombre) {
                db.close();
                reject(new Error('No valid fields to update'));
                return;
            }

            const query = 'UPDATE grupos SET nombre = ? WHERE id = ?';

            db.run(query, [nombre, id], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Delete grupo by ID
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.run('DELETE FROM grupos WHERE id = ?', [id], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Get grupos count
    static async count() {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.get('SELECT COUNT(*) as count FROM grupos', [], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }
}

module.exports = Grupo;