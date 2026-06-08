import mongoose from 'mongoose';
import TicketModel from '../models/Ticket.model';
import UserModel from '../models/User.model';
import { AppError } from '../utils/AppError';
import { generateTicketNumber } from '../utils/generateTicketNumber';

interface TicketQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildUserFilter = (user: any) => {
  if (user.role === 'Admin') return {};
  if (user.role === 'Agent') return { assignedTo: user._id };
  return { createdBy: user._id };
};

export const createTicket = async (data: any, userId: string) => {
  const ticketNumber = await generateTicketNumber();
  const ticket = await TicketModel.create({
    ...data,
    ticketNumber,
    createdBy: userId,
    statusHistory: [
      { status: 'Open', changedBy: userId, note: 'Ticket created', changedAt: new Date() },
    ],
  });
  return ticket.populate(['createdBy', 'assignedTo']);
};

export const getTickets = async (user: any, query: TicketQuery) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: any = buildUserFilter(user);
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ticketNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [tickets, total] = await Promise.all([
    TicketModel.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    TicketModel.countDocuments(filter),
  ]);

  return { tickets, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const getTicketById = async (id: string, user: any) => {
  const ticket = await TicketModel.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('statusHistory.changedBy', 'name email');

  if (!ticket) throw new AppError('Ticket not found', 404);

  if (user.role === 'Agent' && ticket.assignedTo?._id.toString() !== user._id.toString()) {
    throw new AppError('Access denied', 403);
  }
  if (user.role === 'User' && ticket.createdBy._id.toString() !== user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  return ticket;
};

export const updateTicket = async (id: string, data: any, userId: string) => {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  if (data.status && data.status !== ticket.status) {
    ticket.statusHistory.push({
      status: data.status,
      changedBy: new mongoose.Types.ObjectId(userId),
      note: data.statusNote || `Status changed to ${data.status}`,
      changedAt: new Date(),
    });
  }

  delete data.statusNote;
  Object.assign(ticket, data);
  await ticket.save();

  return ticket
    .populate('createdBy', 'name email')
    .then((t) => t.populate('assignedTo', 'name email'));
};

export const updateTicketStatus = async (id: string, status: string, note: string, userId: string) => {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  ticket.statusHistory.push({
    status,
    changedBy: new mongoose.Types.ObjectId(userId),
    note: note || `Status updated to ${status}`,
    changedAt: new Date(),
  });
  ticket.status = status as any;
  await ticket.save();
  return TicketModel.findById(ticket._id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('statusHistory.changedBy', 'name email');
};

export const assignTicket = async (ticketId: string, assignedTo: string, userId: string) => {
  const agent = await UserModel.findById(assignedTo);
  if (!agent) throw new AppError('User not found', 404);
  if (agent.role !== 'Agent') throw new AppError('Can only assign tickets to Agents', 400);

  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  ticket.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  ticket.statusHistory.push({
    status: ticket.status,
    changedBy: new mongoose.Types.ObjectId(userId),
    note: `Assigned to ${agent.name}`,
    changedAt: new Date(),
  });
  await ticket.save();
  return ticket.populate('assignedTo', 'name email');
};

export const addComment = async (ticketId: string, text: string, userId: string, userRole: string) => {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  if (userRole === 'User' && ticket.createdBy.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }
  if (userRole === 'Agent' && ticket.assignedTo?.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  ticket.comments.push({
    text,
    author: new mongoose.Types.ObjectId(userId),
  } as any);
  await ticket.save();
  return ticket.populate('comments.author', 'name email role');
};

export const deleteTicket = async (id: string) => {
  const ticket = await TicketModel.findByIdAndDelete(id);
  if (!ticket) throw new AppError('Ticket not found', 404);
};
