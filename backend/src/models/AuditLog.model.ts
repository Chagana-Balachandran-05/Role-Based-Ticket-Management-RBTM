import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: 'ATTACHMENT_UPLOADED' | 'ATTACHMENT_FAILED' | 'ATTACHMENT_DELETED';
  ticketId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  details: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ['ATTACHMENT_UPLOADED', 'ATTACHMENT_FAILED', 'ATTACHMENT_DELETED'],
    },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
