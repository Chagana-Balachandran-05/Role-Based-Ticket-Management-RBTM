import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  text: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IStatusHistory {
  status: string;
  changedBy: mongoose.Types.ObjectId;
  note: string;
  changedAt: Date;
}

export interface IAttachment {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  fileHash: string;
  uploadedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'uploaded' | 'failed';
  tempPath?: string; // For worker queue recovery
  uploadedAt: Date;
}

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Technical Issue' | 'Payment Issue' | 'Account Issue' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  comments: IComment[];
  statusHistory: IStatusHistory[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true, enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    fileHash: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'uploaded', 'failed'], default: 'pending' },
    tempPath: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Bug', 'Feature Request', 'Technical Issue', 'Payment Issue', 'Account Issue', 'Other'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [CommentSchema],
    statusHistory: [StatusHistorySchema],
    attachments: [AttachmentSchema],
  },
  { timestamps: true }
);

TicketSchema.index({ title: 'text', description: 'text', ticketNumber: 'text' });

export default mongoose.model<ITicket>('Ticket', TicketSchema);
