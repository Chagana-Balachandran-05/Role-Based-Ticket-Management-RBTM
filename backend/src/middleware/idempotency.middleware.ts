import { Request, Response, NextFunction } from 'express';
import IdempotencyModel from '../models/Idempotency.model';
import { logger } from '../utils/winston';

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    return next();
  }

  try {
    const record = await IdempotencyModel.findOne({ key });
    if (record) {
      logger.info(`Idempotency hit: returning cached response for key ${key}`);
      return res.status(200).json(record.responseBody);
    }

    // Intercept response to store it in DB
    const originalJson = res.json;
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        IdempotencyModel.create({ key, responseBody: body })
          .then(() => logger.info(`Stored idempotency response for key ${key}`))
          .catch((err) => logger.error(`Failed to store idempotency key ${key}:`, err));
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (err) {
    next(err);
  }
};
export default checkIdempotency;
