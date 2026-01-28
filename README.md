# Empire Backend

Backend API for the Empire personal productivity and life management application.

## Features

- User authentication (signup/signin) with JWT
- MongoDB database integration
- Password hashing with bcryptjs
- RESTful API endpoints

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd empire-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3600`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
  - Body: `{ username, email, password, avatar }`
  
- `POST /api/auth/signin` - Login user
  - Body: `{ email, password }`
  
- `GET /api/auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   └── User.js            # User model
├── routes/
│   └── authRoutes.js      # API routes
├── index.js               # Entry point
├── .env                   # Environment variables (not in git)
└── package.json           # Dependencies
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation

## License

ISC
