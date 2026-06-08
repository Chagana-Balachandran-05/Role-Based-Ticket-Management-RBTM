import { Request, Response, NextFunction } from 'express';
import * as TicketService from '../services/ticket.service';
import { successResponse } from '../utils/apiResponse';

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.createTicket(req.body, req.user._id.toString());
    res.status(201).json(successResponse(ticket, 'Ticket created'));
  } catch (err) { next(err); }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await TicketService.getTickets(req.user, req.query as any);
    res.status(200).json(successResponse(result, 'Tickets fetched'));
  } catch (err) { next(err); }
};

export const getTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id, req.user);
    res.status(200).json(successResponse(ticket, 'Ticket fetched'));
  } catch (err) { next(err); }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.updateTicket(req.params.id, req.body, req.user._id.toString());
    res.status(200).json(successResponse(ticket, 'Ticket updated'));
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const ticket = await TicketService.updateTicketStatus(req.params.id, status, note, req.user._id.toString());
    res.status(200).json(successResponse(ticket, 'Status updated'));
  } catch (err) { next(err); }
};

export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.assignTicket(req.params.id, req.body.assignedTo, req.user._id.toString());
    res.status(200).json(successResponse(ticket, 'Ticket assigned'));
  } catch (err) { next(err); }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketService.addComment(req.params.id, req.body.text, req.user._id.toString(), req.user.role);
    res.status(201).json(successResponse(ticket, 'Comment added'));
  } catch (err) { next(err); }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TicketService.deleteTicket(req.params.id);
    res.status(200).json(successResponse({}, 'Ticket deleted'));
  } catch (err) { next(err); }
};

