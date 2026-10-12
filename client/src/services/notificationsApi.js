import { apiClient } from './apiClient.js';

function serialize(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const notificationsApi = {
  list(params = {}) {
    return apiClient.get(`/notifications${serialize(params)}`);
  },
  unreadCount() {
    return apiClient.get('/notifications/unread-count');
  },
  markRead(id) {
    return apiClient.patch(`/notifications/${id}/read`);
  },
  markAllRead() {
    return apiClient.patch('/notifications/read-all');
  },
};
