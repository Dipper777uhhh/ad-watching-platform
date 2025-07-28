const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database('./database/platform.db', (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initDatabase();
            }
        });
    }

    initDatabase() {
        const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        this.db.exec(initSQL, (err) => {
            if (err) {
                console.error('Error initializing database:', err.message);
            } else {
                console.log('Database initialized successfully');
            }
        });
    }

    // User methods
    createUser(birthDate, callback) {
        const sessionId = this.generateSessionId();
        const sql = 'INSERT INTO users (birth_date, session_id) VALUES (?, ?)';
        this.db.run(sql, [birthDate, sessionId], function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, sessionId: sessionId });
            }
        });
    }

    getUserBySession(sessionId, callback) {
        const sql = 'SELECT * FROM users WHERE session_id = ?';
        this.db.get(sql, [sessionId], callback);
    }

    updateUserBalance(userId, amount, callback) {
        const sql = 'UPDATE users SET balance = balance + ? WHERE id = ?';
        this.db.run(sql, [amount, userId], callback);
    }

    // Ad viewing methods
    recordAdView(userId, callback) {
        const earnings = 0.0007;
        const sql = 'INSERT INTO ad_views (user_id, earnings) VALUES (?, ?)';
        this.db.run(sql, [userId, earnings], (err) => {
            if (err) {
                callback(err);
            } else {
                this.updateUserBalance(userId, earnings, callback);
            }
        });
    }

    // Promo code methods
    usePromoCode(code, userId, callback) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if user already used a promo today
        this.db.get('SELECT last_promo_date FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                callback(err, null);
                return;
            }

            if (user.last_promo_date === today) {
                callback(null, { success: false, message: 'Bu gün artıq promo kod istifadə etmisiniz' });
                return;
            }

            // Check if promo code exists and is not used
            this.db.get('SELECT * FROM promo_codes WHERE code = ? AND is_used = 0', [code], (err, promo) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                if (!promo) {
                    callback(null, { success: false, message: 'Promo kod tapılmadı və ya artıq istifadə edilib' });
                    return;
                }

                // Use the promo code
                this.db.run('UPDATE promo_codes SET is_used = 1, used_by_user_id = ? WHERE code = ?', [userId, code], (err) => {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    // Update user balance and last promo date
                    this.db.run('UPDATE users SET balance = balance + ?, last_promo_date = ? WHERE id = ?', 
                        [promo.value, today, userId], (err) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, { success: true, message: 'Promo kod uğurla istifadə edildi!', earned: promo.value });
                        }
                    });
                });
            });
        });
    }

    // Withdrawal methods
    createWithdrawal(userId, amount, method, accountDetails, callback) {
        const sql = 'INSERT INTO withdrawals (user_id, amount, method, account_details) VALUES (?, ?, ?, ?)';
        this.db.run(sql, [userId, amount, method, accountDetails], function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID });
            }
        });
    }

    // Admin methods
    getAllUsers(callback) {
        const sql = 'SELECT id, birth_date, balance, ads_watched_today, registration_date FROM users ORDER BY registration_date DESC';
        this.db.all(sql, callback);
    }

    getAllWithdrawals(callback) {
        const sql = `SELECT w.*, u.birth_date 
                     FROM withdrawals w 
                     JOIN users u ON w.user_id = u.id 
                     ORDER BY w.request_date DESC`;
        this.db.all(sql, callback);
    }

    updateWithdrawalStatus(withdrawalId, status, callback) {
        const sql = 'UPDATE withdrawals SET status = ?, processed_date = CURRENT_TIMESTAMP WHERE id = ?';
        this.db.run(sql, [status, withdrawalId], callback);
    }

    getPromoCodeStats(callback) {
        const sql = `SELECT 
                        COUNT(*) as total_codes,
                        COUNT(CASE WHEN is_used = 1 THEN 1 END) as used_codes,
                        COUNT(CASE WHEN is_used = 0 THEN 1 END) as unused_codes
                     FROM promo_codes`;
        this.db.get(sql, callback);
    }

    getPlatformStats(callback) {
        const sql = `SELECT 
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM ad_views) as total_ad_views,
                        (SELECT SUM(balance) FROM users) as total_balance,
                        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals`;
        this.db.get(sql, callback);
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;
