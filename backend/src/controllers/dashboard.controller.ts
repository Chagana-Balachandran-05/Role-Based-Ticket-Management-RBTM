import { Request, Response, NextFunction } from 'express';
import * as DashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/apiResponse';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await DashboardService.getDashboardStats(req.user!);
    res.status(200).json(successResponse(stats, 'Dashboard stats fetched'));
  } catch (err) { next(err); }
};

