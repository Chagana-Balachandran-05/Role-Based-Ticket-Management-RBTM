import api from './axios';

export const getUsersApi = (params?: object) =>
  api.get('/users', { params });

export const getUserByIdApi = (id: string) =>
  api.get(`/users/${id}`);

export const updateUserApi = (id: string, data: object) =>
  api.put(`/users/${id}`, data);

export const toggleUserStatusApi = (id: string, isActive: boolean) =>
  api.patch(`/users/${id}/status`, { isActive });
