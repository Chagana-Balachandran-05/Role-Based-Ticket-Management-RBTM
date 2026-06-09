import { Response } from 'express';
import { logger } from '../utils/winston';

const sseClients = new Map<string, Set<Response>>();

export const registerSseClient = (ticketId: string, res: Response) => {
  if (!sseClients.has(ticketId)) {
    sseClients.set(ticketId, new Set());
  }
  sseClients.get(ticketId)!.add(res);

  logger.info(`SSE Client registered for ticket: ${ticketId}. Total active tickets monitored: ${sseClients.size}`);

  res.on('close', () => {
    const clients = sseClients.get(ticketId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(ticketId);
      }
    }
    logger.info(`SSE Client disconnected from ticket: ${ticketId}`);
  });
};

export const emitAttachmentUpdate = (ticketId: string, data: any) => {
  const clients = sseClients.get(ticketId);
  if (clients && clients.size > 0) {
    logger.info(`SSE: Broadcasting attachment update for ticket ${ticketId} to ${clients.size} clients`);
    const eventString = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
      try {
        res.write(eventString);
      } catch (err) {
        logger.error('Failed to write SSE update to socket:', err);
      }
    });
  }
};
