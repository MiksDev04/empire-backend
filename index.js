import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import trashRoutes from './routes/trashRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initWorkoutScheduler } from './utils/workoutScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3600;

// Connect to database
connectDB();

// Initialize workout scheduler (runs every Sunday at midnight)
initWorkoutScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Empire Backend API',
    timestamp: new Date().toISOString()
  });
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, There!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Start server (only for local development)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;