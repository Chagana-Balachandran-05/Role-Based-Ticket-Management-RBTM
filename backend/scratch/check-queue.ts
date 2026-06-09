import dotenv from 'dotenv';
dotenv.config();
import { initializeQueue, getQueue } from '../src/services/queue/queueFactory';
import mongoose from 'mongoose';
import connectDB from '../src/config/db';

const checkQueue = async () => {
  await connectDB();
  const queue = await initializeQueue();
  console.log('Active Queue Instance Class:', queue.constructor.name);
  
  // Clean up connections
  if (queue.constructor.name === 'BullQueue') {
    // BullQueue holds connection
  }
  await mongoose.disconnect();
  process.exit(0);
};

checkQueue().catch((err) => {
  console.error('Queue check failed:', err);
  process.exit(1);
});
