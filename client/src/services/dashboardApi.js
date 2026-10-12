import { apiClient } from './apiClient.js';

export const dashboardApi = {
  mine() {
    return apiClient.get('/dashboard/mine');
  },
  admin() {
    return apiClient.get('/dashboard/admin');
  },
};
