const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const moment = require('moment');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'database', 'diet_program.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database
const initSql = fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf8');
db.exec(initSql, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('Database initialized successfully');
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'diet-program-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Utility functions
function calculateBMR(weight, height, age, gender) {
    // Harris-Benedict Equation
    if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
}

function calculateTDEE(bmr, activityLevel) {
    const multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    };
    return bmr * (multipliers[activityLevel] || 1.2);
}

// Routes

// Authentication routes
app.post('/api/register', async (req, res) => {
    const { 
        username, email, password, firstName, lastName, 
        birthDate, gender, height, weight, activityLevel, goal, targetWeight 
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Calculate daily calorie goal
        const age = moment().diff(moment(birthDate), 'years');
        const bmr = calculateBMR(weight, height, age, gender);
        const tdee = calculateTDEE(bmr, activityLevel);
        
        let dailyCalorieGoal = tdee;
        if (goal === 'lose_weight') {
            dailyCalorieGoal = tdee - 500; // 500 calorie deficit
        } else if (goal === 'gain_weight' || goal === 'muscle_gain') {
            dailyCalorieGoal = tdee + 300; // 300 calorie surplus
        }

        const stmt = db.prepare(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, 
                             birth_date, gender, height, weight, activity_level, goal, 
                             target_weight, daily_calorie_goal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            username, email, hashedPassword, firstName, lastName,
            birthDate, gender, height, weight, activityLevel, goal,
            targetWeight, Math.round(dailyCalorieGoal)
        ], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Username or email already exists' });
                } else {
                    res.status(500).json({ error: 'Registration failed' });
                }
                return;
            }
            
            req.session.userId = this.lastID;
            res.json({ 
                message: 'Registration successful',
                userId: this.lastID,
                dailyCalorieGoal: Math.round(dailyCalorieGoal)
            });
        });
        stmt.finalize();
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            req.session.userId = user.id;
            res.json({ 
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    dailyCalorieGoal: user.daily_calorie_goal
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Login failed' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// User profile routes
app.get('/api/profile', requireAuth, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password_hash, ...userProfile } = user;
        res.json(userProfile);
    });
});

app.put('/api/profile', requireAuth, (req, res) => {
    const { height, weight, activityLevel, goal, targetWeight } = req.body;

    db.run(`
        UPDATE users 
        SET height = ?, weight = ?, activity_level = ?, goal = ?, target_weight = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [height, weight, activityLevel, goal, targetWeight, req.session.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Profile update failed' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

// Food items routes
app.get('/api/foods', (req, res) => {
    const { category, search } = req.query;
    let query = 'SELECT * FROM food_items';
    let params = [];

    if (category || search) {
        query += ' WHERE';
        if (category) {
            query += ' category = ?';
            params.push(category);
        }
        if (search) {
            if (category) query += ' AND';
            query += ' name LIKE ?';
            params.push(`%${search}%`);
        }
    }

    query += ' ORDER BY name';

    db.all(query, params, (err, foods) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch foods' });
        }
        res.json(foods);
    });
});

app.get('/api/foods/categories', (req, res) => {
    db.all('SELECT DISTINCT category FROM food_items ORDER BY category', (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.json(categories.map(row => row.category));
    });
});

// Meal tracking routes
app.post('/api/meals', requireAuth, (req, res) => {
    const { mealType, mealDate, items } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert meal
        const stmt = db.prepare(`
            INSERT INTO meals (user_id, meal_type, meal_date, total_calories, total_protein, total_carbs, total_fat)
            VALUES (?, ?, ?, 0, 0, 0, 0)
        `);

        stmt.run([req.session.userId, mealType, mealDate], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to create meal' });
            }

            const mealId = this.lastID;
            let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

            // Insert meal items
            const itemStmt = db.prepare(`
                INSERT INTO meal_items (meal_id, food_item_id, quantity, calories, protein, carbs, fat)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            let itemsProcessed = 0;
            items.forEach(item => {
                db.get('SELECT * FROM food_items WHERE id = ?', [item.foodItemId], (err, food) => {
                    if (err || !food) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: 'Invalid food item' });
                    }

                    const quantity = item.quantity;
                    const calories = Math.round((food.calories_per_100g * quantity) / 100);
                    const protein = (food.protein_per_100g * quantity) / 100;
                    const carbs = (food.carbs_per_100g * quantity) / 100;
                    const fat = (food.fat_per_100g * quantity) / 100;

                    totalCalories += calories;
                    totalProtein += protein;
                    totalCarbs += carbs;
                    totalFat += fat;

                    itemStmt.run([mealId, item.foodItemId, quantity, calories, protein, carbs, fat], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to add meal item' });
                        }

                        itemsProcessed++;
                        if (itemsProcessed === items.length) {
                            // Update meal totals
                            db.run(`
                                UPDATE meals 
                                SET total_calories = ?, total_protein = ?, total_carbs = ?, total_fat = ?
                                WHERE id = ?
                            `, [totalCalories, totalProtein, totalCarbs, totalFat, mealId], (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: 'Failed to update meal totals' });
                                }

                                db.run('COMMIT');
                                res.json({ 
                                    message: 'Meal added successfully',
                                    mealId: mealId,
                                    totals: { totalCalories, totalProtein, totalCarbs, totalFat }
                                });
                            });
                        }
                    });
                });
            });

            itemStmt.finalize();
        });
        stmt.finalize();
    });
});

app.get('/api/meals', requireAuth, (req, res) => {
    const { date } = req.query;

    let query = `
        SELECT m.*, 
               GROUP_CONCAT(
                   json_object(
                       'id', mi.id,
                       'food_name', f.name,
                       'quantity', mi.quantity,
                       'calories', mi.calories,
                       'protein', mi.protein,
                       'carbs', mi.carbs,
                       'fat', mi.fat
                   )
               ) as items
        FROM meals m
        LEFT JOIN meal_items mi ON m.id = mi.meal_id
        LEFT JOIN food_items f ON mi.food_item_id = f.id
        WHERE m.user_id = ?
    `;
    
    let params = [req.session.userId];

    if (date) {
        query += ' AND m.meal_date = ?';
        params.push(date);
    }

    query += ' GROUP BY m.id ORDER BY m.meal_date DESC, m.meal_type';

    db.all(query, params, (err, meals) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch meals' });
        }

        // Parse items JSON
        const mealsWithItems = meals.map(meal => ({
            ...meal,
            items: meal.items ? meal.items.split(',').map(item => JSON.parse(item)) : []
        }));

        res.json(mealsWithItems);
    });
});

// Progress tracking routes
app.post('/api/progress', requireAuth, (req, res) => {
    const { date, weight, waterIntake, exerciseMinutes, notes } = req.body;

    db.run(`
        INSERT OR REPLACE INTO user_progress 
        (user_id, date, weight, water_intake, exercise_minutes, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [req.session.userId, date, weight, waterIntake, exerciseMinutes, notes], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save progress' });
        }
        res.json({ message: 'Progress saved successfully' });
    });
});

app.get('/api/progress', requireAuth, (req, res) => {
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM user_progress WHERE user_id = ?';
    let params = [req.session.userId];

    if (startDate && endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';

    db.all(query, params, (err, progress) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch progress' });
        }
        res.json(progress);
    });
});

// Diet plans routes
app.get('/api/diet-plans', (req, res) => {
    db.all('SELECT * FROM diet_plans WHERE is_public = 1 ORDER BY name', (err, plans) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch diet plans' });
        }
        res.json(plans);
    });
});

app.get('/api/diet-plans/:id', (req, res) => {
    const planId = req.params.id;

    db.get('SELECT * FROM diet_plans WHERE id = ?', [planId], (err, plan) => {
        if (err || !plan) {
            return res.status(404).json({ error: 'Diet plan not found' });
        }

        // Get plan meals
        db.all(`
            SELECT dpm.*, 
                   GROUP_CONCAT(
                       json_object(
                           'food_name', f.name,
                           'quantity', dpmi.quantity,
                           'calories_per_100g', f.calories_per_100g
                       )
                   ) as items
            FROM diet_plan_meals dpm
            LEFT JOIN diet_plan_meal_items dpmi ON dpm.id = dpmi.diet_plan_meal_id
            LEFT JOIN food_items f ON dpmi.food_item_id = f.id
            WHERE dpm.diet_plan_id = ?
            GROUP BY dpm.id
            ORDER BY dpm.day_number, dpm.meal_type
        `, [planId], (err, meals) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch plan meals' });
            }

            const mealsWithItems = meals.map(meal => ({
                ...meal,
                items: meal.items ? meal.items.split(',').map(item => JSON.parse(item)) : []
            }));

            res.json({
                ...plan,
                meals: mealsWithItems
            });
        });
    });
});

// Dashboard data
app.get('/api/dashboard', requireAuth, (req, res) => {
    const today = moment().format('YYYY-MM-DD');

    // Get today's meals and totals
    db.all(`
        SELECT SUM(total_calories) as daily_calories,
               SUM(total_protein) as daily_protein,
               SUM(total_carbs) as daily_carbs,
               SUM(total_fat) as daily_fat
        FROM meals 
        WHERE user_id = ? AND meal_date = ?
    `, [req.session.userId, today], (err, dailyTotals) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }

        // Get user's daily goal
        db.get('SELECT daily_calorie_goal, weight, target_weight FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch user data' });
            }

            // Get latest weight progress
            db.get(`
                SELECT weight, date 
                FROM user_progress 
                WHERE user_id = ? AND weight IS NOT NULL 
                ORDER BY date DESC 
                LIMIT 1
            `, [req.session.userId], (err, latestWeight) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch weight data' });
                }

                const dashboardData = {
                    dailyCalorieGoal: user.daily_calorie_goal,
                    currentWeight: latestWeight ? latestWeight.weight : user.weight,
                    targetWeight: user.target_weight,
                    today: {
                        calories: dailyTotals[0].daily_calories || 0,
                        protein: dailyTotals[0].daily_protein || 0,
                        carbs: dailyTotals[0].daily_carbs || 0,
                        fat: dailyTotals[0].daily_fat || 0
                    }
                };

                res.json(dashboardData);
            });
        });
    });
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Diet Program server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});
