import { apiClient } from './apiClient.js';

export const settingsApi = {
  getSettings() {
    return apiClient.get('/settings');
  },
  updateSettings(data) {
    return apiClient.patch('/settings', data);
  },
};
