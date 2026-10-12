import { apiClient } from './apiClient.js';

export const calendarApi = {
  checkRange(startDate, endDate) {
    return apiClient.post('/calendar/check-range', { startDate, endDate });
  },
  events(params = {}) {
    const search = new URLSearchParams();
    if (params.startDate) search.set('startDate', params.startDate);
    if (params.endDate) search.set('endDate', params.endDate);
    if (params.type) search.set('type', params.type);
    if (params.includeInactive !== undefined) {
      search.set('includeInactive', params.includeInactive);
    }
    const qs = search.toString();
    return apiClient.get(`/calendar/events${qs ? `?${qs}` : ''}`);
  },
  get(id) {
    return apiClient.get(`/calendar/events/${id}`);
  },
  create(body) {
    return apiClient.post('/calendar/events', body);
  },
  update(id, body) {
    return apiClient.patch(`/calendar/events/${id}`, body);
  },
  delete(id) {
    return apiClient.delete(`/calendar/events/${id}`);
  },
};
