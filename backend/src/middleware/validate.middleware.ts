import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errorResponse('Validation failed', errors.array()));
  }
  next();
};

