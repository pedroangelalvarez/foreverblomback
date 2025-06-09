const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');

class Concepto {
    // Get database connection
    static getDatabase() {
        return new sqlite3.Database(DB_PATH);
    }

    // Get all conceptos
    static async findAll(options = {}) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const query = 'SELECT * FROM conceptos ORDER BY nombre ASC';

            db.all(query, [], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get concepto by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const query = 'SELECT * FROM conceptos WHERE id = ?';
            
            db.get(query, [id], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    // Create new concepto
    static async create(conceptoData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const { nombre, subtotal } = conceptoData;
            const query = 'INSERT INTO conceptos (nombre, subtotal) VALUES (?, ?)';

            db.run(query, [nombre, subtotal], function(err) {
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

    // Update concepto by ID
    static async update(id, conceptoData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const updateFields = [];
            const params = [];

            // Build dynamic update query
            const allowedFields = ['nombre', 'subtotal'];

            allowedFields.forEach(field => {
                if (conceptoData.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    params.push(conceptoData[field]);
                }
            });

            if (updateFields.length === 0) {
                db.close();
                reject(new Error('No valid fields to update'));
                return;
            }

            params.push(id);
            const query = `UPDATE conceptos SET ${updateFields.join(', ')} WHERE id = ?`;

            db.run(query, params, function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
}

module.exports = Concepto;