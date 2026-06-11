import api from './axios';

export const getTicketsApi = (params?: object) =>
  api.get('/tickets', { params });

export const getTicketByIdApi = (id: string) =>
  api.get(`/tickets/${id}`);

export const createTicketApi = (data: object | FormData, headers?: object) =>
  api.post('/tickets', data, { headers });

export const updateTicketApi = (id: string, data: object) =>
  api.put(`/tickets/${id}`, data);

export const deleteTicketApi = (id: string) =>
  api.delete(`/tickets/${id}`);

export const updateTicketStatusApi = (
  id: string,
  data: { status: string; note?: string }
) => api.patch(`/tickets/${id}/status`, data);

export const assignTicketApi = (id: string, data: { assignedTo: string }) =>
  api.patch(`/tickets/${id}/assign`, data);

export const addCommentApi = (id: string, data: { text: string }) =>
  api.post(`/tickets/${id}/comments`, data);

export const uploadAttachmentsApi = (id: string, data: FormData, headers?: object) =>
  api.post(`/v1/tickets/${id}/attachments`, data, { headers });

export const deleteAttachmentApi = (ticketId: string, attachmentId: string) =>
  api.delete(`/v1/tickets/${ticketId}/attachments/${attachmentId}`);
