const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Database = require('./database/database');

const app = express();
const db = new Database();
const PORT = process.env.PORT || 8000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const adWatchLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // limit each IP to 1 ad watch per minute
    message: 'Çox tez reklam baxırsınız. Bir dəqiqə gözləyin.',
    standardHeaders: true,
    legacyHeaders: false,
});

const promoLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1, // limit each IP to 1 promo code per day
    message: 'Bu gün artıq promo kod istifadə etmisiniz.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'ad-platform-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/register.html');
    }
    next();
}

// Admin authentication middleware
function requireAdmin(req, res, next) {
    const adminKey = req.query.key || req.body.key;
    if (adminKey !== 'admin-secret-2024') {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
}

// Routes

// User registration
app.post('/api/register', (req, res) => {
    const { birthDate } = req.body;
    
    if (!birthDate) {
        return res.status(400).json({ error: 'Doğum tarixi tələb olunur' });
    }

    const year = new Date(birthDate).getFullYear();
    if (year < 1950 || year > 2025) {
        return res.status(400).json({ error: 'Doğum tarixi 1950-2025 arasında olmalıdır' });
    }

    db.createUser(birthDate, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
        }

        req.session.userId = result.id;
        req.session.sessionId = result.sessionId;
        res.json({ success: true, message: 'Qeydiyyat uğurla tamamlandı' });
    });
});

// Get user info
app.get('/api/user', requireAuth, (req, res) => {
    db.getUserBySession(req.session.sessionId, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }

        res.json({
            id: user.id,
            balance: parseFloat(user.balance).toFixed(4),
            adsWatchedToday: user.ads_watched_today,
            registrationDate: user.registration_date
        });
    });
});

// Watch ad
app.post('/api/watch-ad', requireAuth, adWatchLimit, (req, res) => {
    db.recordAdView(req.session.userId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Reklam baxış zamanı xəta baş verdi' });
        }

        res.json({ 
            success: true, 
            message: 'Reklam uğurla baxıldı!', 
            earned: 0.0007 
        });
    });
});

// Use promo code
app.post('/api/promo', requireAuth, promoLimit, (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Promo kod tələb olunur' });
    }

    db.usePromoCode(code.toUpperCase(), req.session.userId, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Promo kod istifadə zamanı xəta baş verdi' });
        }

        res.json(result);
    });
});

// Create withdrawal
app.post('/api/withdraw', requireAuth, (req, res) => {
    const { amount, method, accountDetails } = req.body;
    
    if (!amount || !method || !accountDetails) {
        return res.status(400).json({ error: 'Bütün sahələr tələb olunur' });
    }

    if (parseFloat(amount) < 3.50) {
        return res.status(400).json({ error: 'Minimum çıxarış məbləği 3.50 qəpikdir' });
    }

    // Check user balance
    db.getUserBySession(req.session.sessionId, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }

        if (parseFloat(user.balance) < parseFloat(amount)) {
            return res.status(400).json({ error: 'Balansınız kifayət deyil' });
        }

        db.createWithdrawal(req.session.userId, amount, method, accountDetails, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Çıxarış sorğusu zamanı xəta baş verdi' });
            }

            res.json({ 
                success: true, 
                message: 'Çıxarış sorğunuz göndərildi və admin tərəfindən nəzərdən keçiriləcək' 
            });
        });
    });
});

// Admin routes
app.get('/admin-panel-secret-2024', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
    db.getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({ error: 'İstifadəçilər yüklənə bilmədi' });
        }
        res.json(users);
    });
});

app.get('/api/admin/withdrawals', requireAdmin, (req, res) => {
    db.getAllWithdrawals((err, withdrawals) => {
        if (err) {
            return res.status(500).json({ error: 'Çıxarışlar yüklənə bilmədi' });
        }
        res.json(withdrawals);
    });
});

app.post('/api/admin/withdrawal/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Yanlış status' });
    }

    db.updateWithdrawalStatus(id, status, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Status yenilənə bilmədi' });
        }
        res.json({ success: true, message: 'Status yeniləndi' });
    });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
    db.getPlatformStats((err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Statistikalar yüklənə bilmədi' });
        }

        db.getPromoCodeStats((err, promoStats) => {
            if (err) {
                return res.status(500).json({ error: 'Promo kod statistikaları yüklənə bilmədi' });
            }

            res.json({
                ...stats,
                ...promoStats
            });
        });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Çıxış zamanı xəta baş verdi' });
        }
        res.json({ success: true, message: 'Uğurla çıxış edildi' });
    });
});

// Default route
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/register.html');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin-panel-secret-2024?key=admin-secret-2024`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close();
    process.exit(0);
});
