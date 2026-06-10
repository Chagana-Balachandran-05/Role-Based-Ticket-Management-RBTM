import mongoose from 'mongoose';
import AuditLogModel, { AuditAction } from '../models/AuditLog.model';
import { logger } from '../utils/winston';

interface CreateAuditLogParams {
  action: AuditAction;
  performedBy: string;
  targetType: 'Ticket' | 'User' | 'Attachment';
  targetId: string;
  changes?: { from: any; to: any };
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export const createAuditLog = async (params: CreateAuditLogParams): Promise<void> => {
  try {
    await AuditLogModel.create({
      action: params.action,
      performedBy: new mongoose.Types.ObjectId(params.performedBy),
      targetType: params.targetType,
      targetId: new mongoose.Types.ObjectId(params.targetId),
      changes: params.changes,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
};
