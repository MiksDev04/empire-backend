import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3600;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Hello from the Empire backend!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

// For local development
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless deployment
export default app;