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

export const leavesApi = {
  submit(body) {
    return apiClient.post('/leaves', body);
  },
  list(params = {}) {
    return apiClient.get(`/leaves${serialize(params)}`);
  },
  mine(params = {}) {
    return apiClient.get(`/leaves/mine${serialize(params)}`);
  },
  mineSummary() {
    return apiClient.get('/leaves/mine/summary');
  },
  get(id) {
    return apiClient.get(`/leaves/${id}`);
  },
  letter(id) {
    return apiClient.get(`/leaves/${id}/letter`);
  },
  approve(id, body = {}) {
    return apiClient.post(`/leaves/${id}/approve`, body);
  },
  reject(id, body = {}) {
    return apiClient.post(`/leaves/${id}/reject`, body);
  },
  pdfUrl(id) {
    return `/api/v1/leaves/${id}/pdf`;
  },
  async downloadPdf(id, filename) {
    const res = await fetch(`/api/v1/leaves/${id}/pdf`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to download official PDF document.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Leave_Application_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
