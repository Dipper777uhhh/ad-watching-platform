
Built by https://www.blackbox.ai

---

```markdown
# Ad-Watching Platform

## Project Overview
The Ad-Watching Platform is a fully functional system designed for users to earn rewards by viewing advertisements. The platform features a user registration and authentication system, ad watching capabilities to earn coins, promo code functionality, and a withdrawal system to cash in earned rewards. An admin panel allows for management of users, withdrawals, and promo code distributions. The platform is built using Node.js and Express.js with a focus on a mobile-responsive design.

## Installation
To set up the Ad-Watching Platform locally, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/ad-watching-platform.git
    cd ad-watching-platform
    ```

2. **Install dependencies**:
    Make sure you have Node.js and npm installed. Then run:
    ```bash
    npm install
    ```

3. **Set up the database**:
    Initialize the database by executing the SQL commands found in the `database/init.sql` file.
    
4. **Run the application**:
    Start the server with the following command:
    ```bash
    npm start
    ```

5. **Access the application**:
    Open your browser and go to `http://localhost:8000` to interact with the platform.

## Usage
- **User Registration**: Users can register by providing their birth date.
- **Watch Ads**: Users can earn coins by clicking the "Watch Ad" button which links to advertisements.
- **Promo Codes**: Users can enter a promo code once per day to earn additional coins.
- **Withdrawals**: Users can request withdrawals of their earnings. The minimum withdrawal amount is 3.50 coins.
- **Admin Panel**: To view the admin panel, navigate to `/admin-panel-secret-2024` and provide the required admin key.

## Features
- User registration and session-based authentication
- Coinearning through ad-watching
- Promo code functionality
- Withdrawal management system
- Admin panel for managing users and statistics
- Mobile-responsive interface

## Dependencies
The following dependencies are required to run the project, as specified in `package.json`:
- `express`: "^4.18.2"
- `express-session`: "^1.17.3"
- `sqlite3`: "^5.1.6"
- `body-parser`: "^1.20.2"
- `bcrypt`: "^5.1.1"
- `express-rate-limit`: "^6.10.0"
  
To install these dependencies, ensure you run `npm install`.

## Project Structure
```
/
├── server.js                # Main server file
├── package.json             # Project metadata and dependencies
├── database/                # Database related files
│   ├── init.sql             # SQL initialization script
│   └── database.js          # Database connection and queries
├── public/                  # Static files (HTML, CSS, JS)
│   ├── index.html           # Main page
│   ├── register.html        # User registration page
│   ├── earn.html            # Ad watching page
│   ├── rewards.html         # Promo code entry page
│   ├── withdraw.html        # Withdrawal request page
│   ├── admin.html           # Hidden admin panel
│   ├── css/
│   │   └── style.css        # CSS stylesheet
│   └── js/
│       ├── main.js          # Main JS file
│       ├── ads.js           # Ad watching functionality
│       └── admin.js         # Admin panel functionality
└── routes/                  # API routes
    ├── auth.js              # Authentication routes
    ├── ads.js               # Ad-related routes
    ├── promo.js             # Promo code routes
    ├── withdraw.js          # Withdrawal routes
    └── admin.js             # Admin routes
```

## Conclusion
The Ad-Watching Platform is a unique and efficient way for users to earn rewards by watching advertisements. The combination of a friendly user interface, robust backend, and useful features makes it an engaging platform for users.
```

This README provides a comprehensive guide to understanding, installing, and using the Ad-Watching Platform, making it an invaluable resource for users and developers alike.