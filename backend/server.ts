import dotenv from 'dotenv';
dotenv.config();
import app from './src/app';
import connectDB from './src/config/db';
import { initializeQueue } from './src/services/queue/queueFactory';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initializeQueue();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

start();
