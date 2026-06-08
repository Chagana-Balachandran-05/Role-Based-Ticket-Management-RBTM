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
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
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
  },
  { timestamps: true }
);

export default mongoose.model<ITicket>('Ticket', TicketSchema);
