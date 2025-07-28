# Ad-Watching Platform - Comprehensive Development Plan

## Project Overview
Creating a fully functional ad-watching platform with backend, database, and admin panel.

## Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript (Mobile-responsive)
- **Backend**: Node.js with Express.js
- **Database**: SQLite (for simplicity) or MySQL
- **Session Management**: Express-session
- **Admin Panel**: Separate secure interface

## Database Schema

### Users Table
- id (PRIMARY KEY)
- birth_date (DATE)
- balance (DECIMAL)
- ads_watched_today (INTEGER)
- last_promo_date (DATE)
- registration_date (TIMESTAMP)

### Promo_Codes Table
- id (PRIMARY KEY)
- code (VARCHAR, UNIQUE)
- value (DECIMAL - 0.001)
- is_used (BOOLEAN)
- used_by_user_id (FOREIGN KEY)
- created_date (TIMESTAMP)

### Withdrawals Table
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- amount (DECIMAL)
- method (VARCHAR - 'M10' or 'Bank Card')
- account_details (TEXT)
- status (VARCHAR - 'pending', 'approved', 'rejected')
- request_date (TIMESTAMP)
- processed_date (TIMESTAMP)

### Ad_Views Table
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- earnings (DECIMAL - 0.0007)
- view_date (TIMESTAMP)

## Features Implementation

### 1. User Registration & Authentication
- Birth date selection (1950-2025)
- Simple session-based authentication
- No profile page (as requested)

### 2. Ad Watching System
- "Watch Ad" button with provided link
- Track ad views per user
- Award 0.0007 coins per ad
- Integration of both ad scripts:
  - Main ad link: https://www.profitableratecpm.com/tr68qctewa?key=1b55d1aca1c2d9e8811e5756abe60019
  - Script: //pl26899343.profitableratecpm.com/0c/cb/90/0ccb90d75e46e2c8545e356b9e5a65ea.js

### 3. Promo Code System
- Daily promo code entry (1 per day)
- Each code worth 0.001 coins
- 50 pre-generated random codes
- Admin can distribute codes via channel

### 4. Withdrawal System
- Minimum withdrawal: 3.50 coins
- Methods: M10 wallet, Bank card
- Requests sent to admin panel
- Status tracking

### 5. Admin Panel (Hidden)
- Secret URL: /admin-panel-secret-2024
- View all users and balances
- Manage withdrawal requests
- View promo code usage
- Generate new promo codes
- Platform statistics

### 6. Mobile-Responsive Design
- Clean, modern interface
- Bottom navigation menu
- Optimized for mobile devices

## File Structure
```
/
├── server.js (Main server file)
├── package.json
├── database/
│   ├── init.sql
│   └── database.js
├── public/
│   ├── index.html (Main page)
│   ├── register.html
│   ├── earn.html
│   ├── rewards.html
│   ├── withdraw.html
│   ├── admin.html (Hidden admin panel)
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── ads.js
│       └── admin.js
└── routes/
    ├── auth.js
    ├── ads.js
    ├── promo.js
    ├── withdraw.js
    └── admin.js
```

## Navigation Structure
- **Home**: Balance display, Watch Ad button
- **Earn**: Ad watching, future tasks
- **Rewards**: Promo code entry
- **Withdraw**: Withdrawal requests (replaces Profile)
- **Stars**: Ad watching history

## Security Features
- Session-based authentication
- Input validation and sanitization
- Rate limiting for ad watching
- Secure admin panel access
- SQL injection prevention

## 50 Pre-generated Promo Codes
Will generate 50 unique random codes like:
- EARN2024A1B2C3
- BONUS5X7Y9Z4K6
- REWARD8M3N7P2Q5
- (47 more unique codes)

## Implementation Steps
1. Set up Node.js server and database
2. Create user registration and authentication
3. Implement ad watching system
4. Build promo code functionality
5. Create withdrawal system
6. Develop admin panel
7. Design mobile-responsive frontend
8. Integrate ad scripts
9. Test all functionality
10. Deploy and provide admin access

## Admin Panel Features
- User management
- Withdrawal request handling
- Promo code management
- Platform statistics
- Revenue tracking
