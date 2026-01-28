import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache the database connection for serverless
let cachedConnection = null;

const connectDB = async () => {
  // If we have a cached connection, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit process in serverless environment
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
