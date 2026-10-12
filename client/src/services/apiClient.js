const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const unauthorizedListeners = new Set();

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore listener errors */
    }
  });
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, options = {}) {
  const { body, headers, method = 'GET', ...rest } = options;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  };

  if (UNSAFE_METHODS.has(String(method).toUpperCase())) {
    const csrfToken = readCookie('csrfToken');
    if (csrfToken && !finalHeaders['X-CSRF-Token']) {
      finalHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: finalHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
    }
    const error = new Error(
      payload?.error?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.code = payload?.error?.code || 'REQUEST_FAILED';
    error.details = payload?.error?.details || [];
    throw error;
  }

  return payload;
}

export const apiClient = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body, ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};
