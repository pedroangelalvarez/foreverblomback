const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');

class Guest {
    // Get database connection
    static getDatabase() {
        return new sqlite3.Database(DB_PATH);
    }

    // Get all guests with optional pagination and filtering
    static async findAll(options = {}) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            let query = 'SELECT * FROM guests';
            const params = [];
            const conditions = [];

            // Add filtering conditions
            if (options.gender) {
                conditions.push('gender = ?');
                params.push(options.gender);
            }
            
            if (options.family) {
                conditions.push('family LIKE ?');
                params.push(`%${options.family}%`);
            }

            if (options.confirmation !== undefined) {
                conditions.push('confirmation = ?');
                params.push(options.confirmation);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            query += ' ORDER BY created_at DESC';

            // Add pagination
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
                    // Convert boolean fields
                    const guests = rows.map(row => ({
                        ...row,
                        confirmation: Boolean(row.confirmation)
                    }));
                    resolve(guests);
                }
            });
        });
    }

    // Get guest by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.get('SELECT * FROM guests WHERE id = ?', [id], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else if (row) {
                    // Convert boolean fields
                    const guest = {
                        ...row,
                        confirmation: Boolean(row.confirmation)
                    };
                    resolve(guest);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Create new guest
    static async create(guestData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const {
                first_name,
                last_name,
                gender,
                family,
                guest_count,
                expiration_date,
                confirmation
            } = guestData;

            const query = `
                INSERT INTO guests 
                (first_name, last_name, gender, family, guest_count, expiration_date, confirmation)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                first_name,
                last_name,
                gender || null,
                family || null,
                guest_count || 1,
                expiration_date || null,
                confirmation || false
            ];

            db.run(query, params, function(err) {
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

    // Update guest by ID
    static async update(id, guestData) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            const updateFields = [];
            const params = [];

            // Build dynamic update query
            const allowedFields = [
                'first_name', 'last_name', 'gender', 'family', 
                'guest_count', 'expiration_date', 'confirmation'
            ];

            allowedFields.forEach(field => {
                if (guestData.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    params.push(guestData[field]);
                }
            });

            if (updateFields.length === 0) {
                db.close();
                reject(new Error('No valid fields to update'));
                return;
            }

            params.push(id);
            const query = `UPDATE guests SET ${updateFields.join(', ')} WHERE id = ?`;

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

    // Delete guest by ID
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            db.run('DELETE FROM guests WHERE id = ?', [id], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Get guest count
    static async count(filters = {}) {
        return new Promise((resolve, reject) => {
            const db = this.getDatabase();
            
            let query = 'SELECT COUNT(*) as count FROM guests';
            const params = [];
            const conditions = [];

            if (filters.gender) {
                conditions.push('gender = ?');
                params.push(filters.gender);
            }
            
            if (filters.family) {
                conditions.push('family LIKE ?');
                params.push(`%${filters.family}%`);
            }

            if (filters.confirmation !== undefined) {
                conditions.push('confirmation = ?');
                params.push(filters.confirmation);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
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

    static clearTestData() {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM guests', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = Guest;
