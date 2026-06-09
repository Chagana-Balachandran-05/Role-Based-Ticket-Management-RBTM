import mongoose from 'mongoose';
import TicketModel, { ITicket } from '../models/Ticket.model';
import UserModel, { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { generateTicketNumber } from '../utils/generateTicketNumber';
import { CreateTicketDTO, UpdateTicketDTO, GetTicketsQueryDTO } from '../types/dtos';

const buildUserFilter = (user: IUser): mongoose.FilterQuery<ITicket> => {
  if (user.role === 'Admin') return {};
  if (user.role === 'Agent') return { assignedTo: user._id };
  return { createdBy: user._id };
};

export const createTicket = async (data: CreateTicketDTO, userId: string) => {
  const ticketNumber = await generateTicketNumber();
  const ticket = await TicketModel.create({
    ...data,
    ticketNumber,
    createdBy: userId,
    statusHistory: [
      { status: 'Open', changedBy: new mongoose.Types.ObjectId(userId), note: 'Ticket created', changedAt: new Date() },
    ],
  });
  return ticket.populate(['createdBy', 'assignedTo']);
};

export const getTickets = async (user: IUser, query: GetTicketsQueryDTO) => {
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

  const filter: mongoose.FilterQuery<ITicket> = buildUserFilter(user);
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  
  if (search) {
    // MongoDB text index search
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: Record<string, 1 | -1> = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

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

export const getTicketById = async (id: string, user: IUser) => {
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

export const updateTicket = async (id: string, data: UpdateTicketDTO, user: IUser) => {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  // Strip status field entirely before updates are processed
  const { status, ...allowedPayload } = data as any;

  let allowedData: Partial<UpdateTicketDTO> = {};
  if (user.role === 'Admin') {
    // Admin can update any field except status (which is stripped above)
    allowedData = { ...allowedPayload };
  } else if (user.role === 'Agent') {
    // Agents can only update title, description, priority, category
    const agentAllowedFields: (keyof UpdateTicketDTO)[] = ['title', 'description', 'priority', 'category'];
    for (const field of agentAllowedFields) {
      if (field in allowedPayload) {
        allowedData[field] = allowedPayload[field];
      }
    }
  } else {
    throw new AppError('Access denied', 403);
  }

  // Ensure statusNote or other custom fields are not applied to the ticket object
  delete (allowedData as any).statusNote;

  Object.assign(ticket, allowedData);
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
