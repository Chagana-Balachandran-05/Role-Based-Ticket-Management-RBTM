import IORedis from 'ioredis';
import { IUploadQueue } from './uploadQueue.interface';
import { MongooseQueue } from './mongooseQueue';
import { BullQueue } from './bullQueue';
import { logger } from '../../utils/winston';

let queueInstance: IUploadQueue;

export const initializeQueue = async (): Promise<IUploadQueue> => {
  if (queueInstance) return queueInstance;

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  logger.info(`Probing Redis connection at ${redisHost}:${redisPort}...`);

  const redisTest = new IORedis({
    host: redisHost,
    port: redisPort,
    connectTimeout: 1500, // 1.5 seconds connection timeout
    maxRetriesPerRequest: 0,
  });

  try {
    await new Promise<void>((resolve, reject) => {
      redisTest.on('connect', () => {
        redisTest.disconnect();
        resolve();
      });
      redisTest.on('error', (err) => {
        redisTest.disconnect();
        reject(err);
      });
    });

    logger.info('Redis is online. Activating BullQueue adapter.');
    queueInstance = new BullQueue();
  } catch (error) {
    logger.warn('Redis connection failed. Falling back to MongooseQueue adapter.');
    queueInstance = new MongooseQueue();
  }

  await queueInstance.start();
  return queueInstance;
};

export const getQueue = (): IUploadQueue => {
  if (!queueInstance) {
    throw new Error('Queue has not been initialized. Call initializeQueue() at application startup.');
  }
  return queueInstance;
};
