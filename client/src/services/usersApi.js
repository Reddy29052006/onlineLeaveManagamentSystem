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

export const usersApi = {
  list(role, params = {}) {
    return apiClient.get(`/users/${role}s${serialize(params)}`);
  },
  create(role, body) {
    return apiClient.post(`/users/${role}s`, body);
  },
  get(role, id) {
    return apiClient.get(`/users/${role}s/${id}`);
  },
  update(role, id, body) {
    return apiClient.patch(`/users/${role}s/${id}`, body);
  },
  setStatus(role, id, accountStatus) {
    return apiClient.patch(`/users/${role}s/${id}/status`, { accountStatus });
  },
  leaveSummary(id) {
    return apiClient.get(`/users/${id}/leave-summary`);
  },
};