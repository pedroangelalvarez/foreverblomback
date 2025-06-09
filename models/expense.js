const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');

class Expense {
    // Get database connection
    static getDatabase() {
        return new sqlite3.Database(DB_PATH);
    }

    // Get all expenses with optional filtering by concepto_id
    static async findAll(options = {}) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            let query = `
                SELECT e.*, c.nombre as concepto_descripcion 
                FROM expenses e 
                LEFT JOIN conceptos c ON e.id_concept = c.id
            `;
            const params = [];

            if (options.id_concept) {
                query += ' WHERE e.id_concept = ?';
                params.push(options.id_concept);
            }

            query += ' ORDER BY e.created_at DESC';

            if (options.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(options.limit));
                
                if (options.offset) {
                    query += ' OFFSET ?';
                    params.push(parseInt(options.offset));
                }
            }

            db.all(query, params, (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get expense by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const query = `
                SELECT e.*, c.nombre as concepto_descripcion 
                FROM expenses e 
                LEFT JOIN conceptos c ON e.id_concept = c.id 
                WHERE e.id = ?
            `;
            
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

    // Create new expense
    static async create(expenseData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const { descripcion, detalle, responsable, monto, id_concept } = expenseData;
            const query = 'INSERT INTO expenses (descripcion, detalle, responsable, monto, id_concept) VALUES (?, ?, ?, ?, ?)';

            db.run(query, [
                descripcion,
                detalle || null,
                responsable || null,
                monto,
                id_concept || null
            ], function(err) {
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

    // Update expense by ID
    static async update(id, expenseData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const updateFields = [];
            const params = [];

            // Build dynamic update query
            const allowedFields = ['descripcion', 'detalle', 'responsable', 'monto', 'id_concept'];

            allowedFields.forEach(field => {
                if (expenseData.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    params.push(expenseData[field]);
                }
            });

            if (updateFields.length === 0) {
                db.close();
                reject(new Error('No valid fields to update'));
                return;
            }

            params.push(id);
            const query = `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = ?`;

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

    // Delete expense by ID
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Get expenses count with optional filtering
    static async count(filters = {}) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            let query = 'SELECT COUNT(*) as count FROM expenses';
            const params = [];

            if (filters.id_concept) {
                query += ' WHERE id_concept = ?';
                params.push(filters.id_concept);
            }

            db.get(query, params, (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    // Get expenses by concepto_id
    static async findByConcepto(id_concept) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const query = `
                SELECT e.*, c.descripcion as concepto_descripcion 
                FROM expenses e 
                LEFT JOIN conceptos c ON e.id_concept = c.id 
                WHERE e.id_concept = ? 
                ORDER BY e.created_at DESC
            `;
            
            db.all(query, [id_concept], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = Expense;