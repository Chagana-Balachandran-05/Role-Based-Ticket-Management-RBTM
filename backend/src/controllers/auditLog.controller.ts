import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AuditLogModel from '../models/AuditLog.model';
import { successResponse } from '../utils/apiResponse';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      targetType,
    } = req.query;

    const filter: mongoose.FilterQuery<any> = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLogModel.countDocuments(filter),
    ]);

    res.status(200).json(successResponse(
      {
        logs,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
      'Audit logs fetched'
    ));
  } catch (err) {
    next(err);
  }
};
