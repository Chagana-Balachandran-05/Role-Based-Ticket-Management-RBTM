import { Request, Response, NextFunction } from 'express';
import * as TicketService from '../services/ticket.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { registerSseClient } from '../services/sse';
import { getAttachmentMetrics } from '../services/metricsCollector';

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as any[]) || [];
    const ticket = await TicketService.createTicketWithFiles(req.body, req.user!._id.toString(), files);
    res.status(201).json(successResponse(ticket, 'Ticket created'));
  } catch (err) { next(err); }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await TicketService.getTickets(req.user!, req.query as any);
    res.status(200).json(successResponse(result, 'Tickets fetched'));
  } catch (err) { next(err); }
};

export const getTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id, req.user!);
    res.status(200).json(successResponse(ticket, 'Ticket fetched'));
  } catch (err) { next(err); }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body && 'status' in req.body) {
      throw new AppError('Status cannot be updated via this endpoint. Please use PATCH /tickets/:id/status', 400);
    }
    const ticket = await TicketService.updateTicket(req.params.id, req.body, req.user!);
    res.status(200).json(successResponse(ticket, 'Ticket updated'));
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const ticket = await TicketService.updateTicketStatus(req.params.id, status, note, req.user!._id.toString());
    res.status(200).json(successResponse(ticket, 'Status updated'));
  } catch (err) { next(err); }
};

export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.assignTicket(req.params.id, req.body.assignedTo, req.user!._id.toString());
    res.status(200).json(successResponse(ticket, 'Ticket assigned'));
  } catch (err) { next(err); }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.addComment(req.params.id, req.body.text, req.user!._id.toString(), req.user!.role);
    res.status(201).json(successResponse(ticket, 'Comment added'));
  } catch (err) { next(err); }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TicketService.deleteTicket(req.params.id);
    res.status(200).json(successResponse({}, 'Ticket deleted'));
  } catch (err) { next(err); }
};

export const addAttachments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as any[]) || [];
    const ticket = await TicketService.addAttachmentsToTicket(
      req.params.id,
      req.user!._id.toString(),
      files,
      req.user!
    );
    res.status(200).json(successResponse(ticket, 'Attachments queued for upload'));
  } catch (err) { next(err); }
};

export const deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.deleteAttachmentFromTicket(
      req.params.id,
      req.params.attachmentId,
      req.user!._id.toString(),
      req.user!
    );
    res.status(200).json(successResponse(ticket, 'Attachment deleted'));
  } catch (err) { next(err); }
};

export const streamAttachments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id, req.user!);
    if (!ticket) throw new AppError('Ticket not found', 404);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(':ok\n\n');

    registerSseClient(req.params.id, res);
  } catch (err) {
    next(err);
  }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getAttachmentMetrics();
    res.status(200).json(successResponse(metrics, 'Attachment metrics fetched'));
  } catch (err) { next(err); }
};

