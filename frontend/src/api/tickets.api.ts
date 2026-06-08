import api from './axios';

export const getTicketsApi = (params?: object) =>
  api.get('/tickets', { params });

export const getTicketByIdApi = (id: string) =>
  api.get(`/tickets/${id}`);

export const createTicketApi = (data: object) =>
  api.post('/tickets', data);

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
