-- Diet Program Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    activity_level VARCHAR(20), -- sedentary, light, moderate, active, very_active
    goal VARCHAR(20), -- lose_weight, maintain, gain_weight, muscle_gain
    target_weight DECIMAL(5,2),
    daily_calorie_goal INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food items table
CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- fruits, vegetables, proteins, grains, dairy, etc.
    calories_per_100g INTEGER NOT NULL,
    protein_per_100g DECIMAL(5,2) DEFAULT 0,
    carbs_per_100g DECIMAL(5,2) DEFAULT 0,
    fat_per_100g DECIMAL(5,2) DEFAULT 0,
    fiber_per_100g DECIMAL(5,2) DEFAULT 0,
    sugar_per_100g DECIMAL(5,2) DEFAULT 0,
    sodium_per_100g DECIMAL(5,2) DEFAULT 0, -- in mg
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet plans table
CREATE TABLE IF NOT EXISTS diet_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- mediterranean, keto, vegan, paleo, balanced, etc.
    duration_days INTEGER,
    target_calories INTEGER,
    created_by INTEGER,
    is_public BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
    meal_date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0,
    total_fat DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Meal items table (foods in each meal)
CREATE TABLE IF NOT EXISTS meal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    food_item_id INTEGER NOT NULL,
    quantity DECIMAL(6,2) NOT NULL, -- in grams
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2),
    daily_calories INTEGER DEFAULT 0,
    daily_protein DECIMAL(5,2) DEFAULT 0,
    daily_carbs DECIMAL(5,2) DEFAULT 0,
    daily_fat DECIMAL(5,2) DEFAULT 0,
    water_intake INTEGER DEFAULT 0, -- in ml
    exercise_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Diet plan meals (template meals for diet plans)
CREATE TABLE IF NOT EXISTS diet_plan_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diet_plan_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    meal_name VARCHAR(100),
    instructions TEXT,
    total_calories INTEGER,
    FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
);

-- Diet plan meal items
CREATE TABLE IF NOT EXISTS diet_plan_meal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diet_plan_meal_id INTEGER NOT NULL,
    food_item_id INTEGER NOT NULL,
    quantity DECIMAL(6,2) NOT NULL,
    FOREIGN KEY (diet_plan_meal_id) REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- User goals and achievements
CREATE TABLE IF NOT EXISTS user_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- weight_loss, calorie_target, water_intake, etc.
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample food items
INSERT OR REPLACE INTO food_items (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g) VALUES
-- Fruits
('Apple', 'fruits', 52, 0.3, 14, 0.2, 2.4),
('Banana', 'fruits', 89, 1.1, 23, 0.3, 2.6),
('Orange', 'fruits', 47, 0.9, 12, 0.1, 2.4),
('Strawberry', 'fruits', 32, 0.7, 8, 0.3, 2.0),

-- Vegetables
('Broccoli', 'vegetables', 34, 2.8, 7, 0.4, 2.6),
('Carrot', 'vegetables', 41, 0.9, 10, 0.2, 2.8),
('Spinach', 'vegetables', 23, 2.9, 4, 0.4, 2.2),
('Tomato', 'vegetables', 18, 0.9, 4, 0.2, 1.2),

-- Proteins
('Chicken Breast', 'proteins', 165, 31, 0, 3.6, 0),
('Salmon', 'proteins', 208, 20, 0, 13, 0),
('Eggs', 'proteins', 155, 13, 1, 11, 0),
('Turkey', 'proteins', 135, 30, 0, 1, 0),

-- Grains
('Brown Rice', 'grains', 123, 2.6, 25, 1, 1.8),
('Oats', 'grains', 389, 17, 66, 7, 10.6),
('Quinoa', 'grains', 120, 4.4, 22, 1.9, 2.8),
('Whole Wheat Bread', 'grains', 247, 13, 41, 4, 7),

-- Dairy
('Greek Yogurt', 'dairy', 59, 10, 4, 0.4, 0),
('Milk (Low Fat)', 'dairy', 42, 3.4, 5, 1, 0),
('Cheese (Cheddar)', 'dairy', 402, 25, 1, 33, 0),

-- Nuts and Seeds
('Almonds', 'nuts', 579, 21, 22, 50, 12),
('Walnuts', 'nuts', 654, 15, 14, 65, 7),
('Chia Seeds', 'seeds', 486, 17, 42, 31, 34);

-- Insert sample diet plans
INSERT OR REPLACE INTO diet_plans (name, description, type, duration_days, target_calories, is_public) VALUES
('Mediterranean Diet Plan', 'A heart-healthy diet based on Mediterranean cuisine', 'mediterranean', 30, 1800, 1),
('Balanced Weight Loss', 'Balanced approach to healthy weight loss', 'balanced', 28, 1500, 1),
('High Protein Muscle Gain', 'High protein diet for muscle building', 'high_protein', 30, 2200, 1),
('Plant-Based Nutrition', 'Complete plant-based nutrition plan', 'vegan', 21, 1600, 1);
