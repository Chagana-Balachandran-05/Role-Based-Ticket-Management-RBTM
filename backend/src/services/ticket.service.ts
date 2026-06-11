import mongoose from 'mongoose';
import TicketModel, { ITicket, IComment } from '../models/Ticket.model';
import UserModel, { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { generateTicketNumber } from '../utils/generateTicketNumber';
import { CreateTicketDTO, UpdateTicketDTO, GetTicketsQueryDTO } from '../types/dtos';
import { uploadStream, deleteFromCloudinary } from '../config/cloudinary';
import { logger } from '../utils/winston';
import { emitAttachmentUpdate } from './sse';
import { createAuditLog } from './auditLog.service';

const buildUserFilter = (user: IUser): mongoose.FilterQuery<ITicket> => {
  if (user.role === 'Admin') return {};
  if (user.role === 'Agent') return { assignedTo: user._id };
  return { createdBy: user._id };
};

const uploadFilesToCloudinary = async (files: Express.Multer.File[], userId: string) => {
  const attachments: any[] = [];

  for (const file of files) {
    try {
      const result = await uploadStream(file.buffer, 'tickets');
      attachments.push({
        fileName: file.originalname,
        originalName: file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: new mongoose.Types.ObjectId(userId),
        status: 'uploaded',
        uploadedAt: new Date(),
      });
    } catch (err) {
      logger.error(`Failed to upload file ${file.originalname} to Cloudinary:`, err);
    }
  }

  return attachments;
};

const populateTicket = (query: mongoose.Query<any, any>) =>
  query
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('statusHistory.changedBy', 'name email');

export const createTicket = async (data: CreateTicketDTO, userId: string, files: Express.Multer.File[] = []) => {
  const ticketNumber = await generateTicketNumber();

  const attachments = files.length > 0 ? await uploadFilesToCloudinary(files, userId) : [];

  const ticket = await TicketModel.create({
    ...data,
    ticketNumber,
    createdBy: userId,
    statusHistory: [
      { status: 'Open', changedBy: new mongoose.Types.ObjectId(userId), note: 'Ticket created', changedAt: new Date() },
    ],
    attachments,
  });

  // Emit SSE for each uploaded attachment
  for (const att of ticket.attachments) {
    emitAttachmentUpdate(ticket._id.toString(), {
      attachmentId: att._id.toString(),
      status: att.status,
      url: att.url,
      fileName: att.originalName,
    });
  }

  await createAuditLog({
    action: 'TICKET_CREATED',
    performedBy: userId,
    targetType: 'Ticket',
    targetId: ticket._id.toString(),
    metadata: { ticketNumber: ticket.ticketNumber, title: ticket.title },
  });

  return populateTicket(TicketModel.findById(ticket._id));
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
  const ticket = await populateTicket(TicketModel.findById(id));

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

  // Strip status field — status updates go through a separate endpoint
  const { title, description, category, priority, assignedTo } = data;
  
  let allowedData: Partial<UpdateTicketDTO> = {};
  if (user.role === 'Admin') {
    // Admin can update any field except status
    if (title !== undefined) allowedData.title = title;
    if (description !== undefined) allowedData.description = description;
    if (category !== undefined) allowedData.category = category;
    if (priority !== undefined) allowedData.priority = priority;
    if (assignedTo !== undefined) allowedData.assignedTo = assignedTo;
  } else if (user.role === 'Agent') {
    // Agents can only update title, description, priority, category
    if (title !== undefined) allowedData.title = title;
    if (description !== undefined) allowedData.description = description;
    if (priority !== undefined) allowedData.priority = priority;
    if (category !== undefined) allowedData.category = category;
  } else {
    throw new AppError('Access denied', 403);
  }

  Object.assign(ticket, allowedData);
  await ticket.save();

  await createAuditLog({
    action: 'TICKET_UPDATED',
    performedBy: user._id.toString(),
    targetType: 'Ticket',
    targetId: id,
    metadata: { ticketNumber: ticket.ticketNumber, updatedFields: Object.keys(allowedData) },
  });

  return populateTicket(TicketModel.findById(ticket._id));
};

export const updateTicketStatus = async (id: string, status: string, note: string, userId: string) => {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const previousStatus = ticket.status;

  ticket.statusHistory.push({
    status,
    changedBy: new mongoose.Types.ObjectId(userId),
    note: note || `Status updated to ${status}`,
    changedAt: new Date(),
  });
  ticket.status = status as ITicket['status'];
  await ticket.save();

  await createAuditLog({
    action: 'STATUS_CHANGED',
    performedBy: userId,
    targetType: 'Ticket',
    targetId: id,
    changes: { from: previousStatus, to: status },
    metadata: { ticketNumber: ticket.ticketNumber },
  });

  return populateTicket(TicketModel.findById(ticket._id));
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

  await createAuditLog({
    action: 'TICKET_ASSIGNED',
    performedBy: userId,
    targetType: 'Ticket',
    targetId: ticketId,
    metadata: { ticketNumber: ticket.ticketNumber, assignedToName: agent.name, assignedToId: assignedTo },
  });

  return populateTicket(TicketModel.findById(ticket._id));
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
  } as IComment);
  await ticket.save();

  await createAuditLog({
    action: 'COMMENT_ADDED',
    performedBy: userId,
    targetType: 'Ticket',
    targetId: ticketId,
    metadata: { ticketNumber: ticket.ticketNumber },
  });

  return populateTicket(TicketModel.findById(ticket._id));
};

export const deleteTicket = async (id: string, user: IUser) => {
  if (user.role !== 'Admin') {
    throw new AppError('Access denied', 403);
  }

  // Fetch before deleting to capture metadata
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  await TicketModel.findByIdAndDelete(id);

  await createAuditLog({
    action: 'TICKET_DELETED',
    performedBy: user._id.toString(),
    targetType: 'Ticket',
    targetId: id,
    metadata: { ticketNumber: ticket.ticketNumber, title: ticket.title },
  });
};

export const addAttachmentsToTicket = async (ticketId: string, userId: string, files: Express.Multer.File[], user: IUser) => {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  if (user.role === 'Agent' && ticket.assignedTo?.toString() !== userId) {
    throw new AppError('Access denied. You are not assigned to this ticket.', 403);
  }
  if (user.role === 'User' && ticket.createdBy.toString() !== userId) {
    throw new AppError('Access denied. You do not own this ticket.', 403);
  }

  const uploaded = await uploadFilesToCloudinary(files, userId);

  for (const att of uploaded) {
    ticket.attachments.push(att);
  }

  await ticket.save();

  // Emit SSE and audit log for each uploaded attachment
  for (const att of ticket.attachments.slice(-uploaded.length)) {
    emitAttachmentUpdate(ticketId, {
      attachmentId: att._id.toString(),
      status: att.status,
      url: att.url,
      fileName: att.originalName,
    });

    await createAuditLog({
      action: 'ATTACHMENT_UPLOADED',
      performedBy: userId,
      targetType: 'Attachment',
      targetId: ticket._id.toString(),
      metadata: { ticketNumber: ticket.ticketNumber, fileName: att.originalName, fileSize: att.size },
    });
  }

  return ticket;
};

export const deleteAttachmentFromTicket = async (ticketId: string, attachmentId: string, userId: string, user: IUser) => {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  if (user.role === 'Agent' && ticket.assignedTo?.toString() !== userId) {
    throw new AppError('Access denied. You are not assigned to this ticket.', 403);
  }
  if (user.role === 'User' && ticket.createdBy.toString() !== userId) {
    throw new AppError('Access denied. You do not own this ticket.', 403);
  }

  const attachmentIndex = ticket.attachments.findIndex((a) => a._id.toString() === attachmentId);
  if (attachmentIndex === -1) throw new AppError('Attachment not found', 404);

  const attachment = ticket.attachments[attachmentIndex];

  if (attachment.publicId) {
    try {
      await deleteFromCloudinary(attachment.publicId);
    } catch (err) {
      logger.error(`Failed to delete Cloudinary file ${attachment.publicId}:`, err);
    }
  }

  ticket.attachments.splice(attachmentIndex, 1);
  await ticket.save();

  await createAuditLog({
    action: 'ATTACHMENT_DELETED',
    performedBy: userId,
    targetType: 'Attachment',
    targetId: ticketId,
    metadata: { ticketNumber: ticket.ticketNumber, fileName: attachment.originalName },
  });

  return ticket;
};
