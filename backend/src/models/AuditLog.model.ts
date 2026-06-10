import mongoose, { Schema, Document } from 'mongoose';

const AUDIT_ACTIONS = [
  'TICKET_CREATED',
  'TICKET_DELETED',
  'STATUS_CHANGED',
  'TICKET_ASSIGNED',
  'TICKET_UPDATED',
  'COMMENT_ADDED',
  'ATTACHMENT_UPLOADED',
  'ATTACHMENT_DELETED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

export interface IAuditLog extends Document {
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  targetType: 'Ticket' | 'User' | 'Attachment';
  targetId: mongoose.Types.ObjectId;
  changes?: {
    from: any;
    to: any;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: AUDIT_ACTIONS,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      required: true,
      enum: ['Ticket', 'User', 'Attachment'],
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    changes: {
      from: { type: Schema.Types.Mixed },
      to: { type: Schema.Types.Mixed },
    },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: auto-expire after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Query performance indexes
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ targetId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
