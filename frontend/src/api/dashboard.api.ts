import api from './axios';

export const getDashboardStatsApi = () =>
  api.get('/dashboard/stats');
