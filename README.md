
# Diyet Proqramı (Diet Program) 🍎

Comprehensive diet tracking and nutrition management application built with Node.js, Express, and SQLite.

## Features ✨

### 🔐 User Authentication
- Secure user registration and login
- Password hashing with bcrypt
- Session-based authentication
- Personal profile management

### 📊 Dashboard & Analytics
- Daily calorie tracking with progress bars
- Macronutrient breakdown (protein, carbs, fat)
- Weight tracking and goal monitoring
- Today's meal summary

### 🍽️ Meal Management
- Add meals by type (breakfast, lunch, dinner, snacks)
- Comprehensive food database with nutritional info
- Food search and categorization
- Automatic calorie and macro calculations
- Meal history and tracking

### 📈 Progress Tracking
- Weight monitoring with visual charts
- Water intake tracking
- Exercise duration logging
- Personal notes and observations
- Historical progress data

### 📋 Diet Plans
- Pre-built diet plan templates
- Mediterranean, balanced, high-protein, plant-based plans
- Calorie target recommendations
- Duration-based planning

### 👤 Profile Management
- Personal information settings
- Physical measurements (height, weight)
- Activity level configuration
- Goal setting (weight loss, maintenance, gain, muscle building)
- BMR and TDEE calculations

## Technology Stack 🛠️

- **Backend**: Node.js, Express.js
- **Database**: SQLite with comprehensive schema
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for data visualization
- **Icons**: Font Awesome
- **Authentication**: bcrypt, express-session
- **Styling**: Modern CSS with CSS Variables

## Installation & Setup 🚀

1. **Clone or access the project**:
   ```bash
   cd /workspace
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   # or
   node server.js
   ```

4. **Access the application**:
   Open your browser and go to: `http://localhost:3000`

## Database Schema 📊

### Core Tables
- **users**: User profiles and authentication
- **food_items**: Comprehensive food database with nutritional data
- **meals**: User meal entries
- **meal_items**: Individual food items in meals
- **user_progress**: Daily progress tracking
- **diet_plans**: Pre-built diet templates

### Sample Data
The application comes pre-loaded with:
- 20+ common foods with nutritional information
- 4 diet plan templates
- Categories: fruits, vegetables, proteins, grains, dairy, nuts

## API Endpoints 🔌

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Food & Meals
- `GET /api/foods` - Get food items (with search/category filters)
- `GET /api/foods/categories` - Get food categories
- `POST /api/meals` - Add new meal
- `GET /api/meals` - Get user meals (with date filter)

### Progress & Analytics
- `POST /api/progress` - Add progress entry
- `GET /api/progress` - Get progress history
- `GET /api/dashboard` - Get dashboard data

### Diet Plans
- `GET /api/diet-plans` - Get available diet plans
- `GET /api/diet-plans/:id` - Get specific diet plan details

## Features in Detail 📋

### 🥗 Food Database
Pre-loaded with nutritional data including:
- Calories per 100g
- Protein, carbohydrates, fat content
- Fiber and sugar information
- Categorized by food groups

### 🎯 Smart Calculations
- BMR (Basal Metabolic Rate) using Harris-Benedict equation
- TDEE (Total Daily Energy Expenditure) based on activity level
- Automatic calorie goal adjustment based on user goals
- Real-time macro and calorie calculations

### 📱 Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts for all screen sizes
- Modern, clean UI with smooth animations

### 🔒 Security Features
- Password hashing with bcrypt
- Session-based authentication
- Input validation and sanitization
- Rate limiting protection
- SQL injection prevention

## Usage Guide 📚

### Getting Started
1. **Register**: Create an account with your personal details
2. **Set Profile**: Configure your physical stats and goals
3. **Add Meals**: Start tracking your daily food intake
4. **Monitor Progress**: Log weight, water intake, and exercise
5. **View Analytics**: Check your dashboard for insights

### Adding Meals
1. Click "Yemək Əlavə Et" (Add Meal)
2. Select meal type and date
3. Search for foods in the database
4. Add foods with quantities
5. Review totals and submit

### Tracking Progress
1. Go to "Tərəqqi" (Progress) section
2. Click "Tərəqqi Əlavə Et" (Add Progress)
3. Enter weight, water intake, exercise duration
4. Add optional notes
5. View your progress charts

## Language Support 🌍

The application is currently available in:
- **Azerbaijani (az)**: Primary language
- UI elements, messages, and content in Azerbaijani

## Project Structure 📁

```
/workspace/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── database/
│   ├── init.sql            # Database schema and sample data
│   └── diet_program.db     # SQLite database (auto-created)
├── public/
│   ├── index.html          # Main application page
│   ├── css/
│   │   └── style.css       # Comprehensive styling
│   └── js/
│       └── app.js          # Frontend application logic
└── README.md               # This file
```

## Development Notes 🔧

### Database Initialization
- Database and tables are created automatically on first run
- Sample data is inserted if not already present
- Schema supports comprehensive nutrition tracking

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: 320px - 767px

### Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers on iOS and Android

## Contributing 🤝

This is a complete diet program application with:
- ✅ User authentication and profiles
- ✅ Comprehensive meal tracking
- ✅ Progress monitoring with charts
- ✅ Food database with nutritional data
- ✅ Diet plan templates
- ✅ Responsive design
- ✅ Modern UI/UX

## License 📄

MIT License - See package.json for details

---

**Access the application**: [http://localhost:3000](http://localhost:3000)

**Server Status**: 🟢 Running on port 3000