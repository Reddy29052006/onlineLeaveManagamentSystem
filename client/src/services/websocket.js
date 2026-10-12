/**
 * Client WebSocket Service for Real-time Notifications and Live Updates
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isExplicitlyClosed = false;
  }

  getUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  connect(user) {
    this.currentUser = user;
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (this.currentUser) {
        this.sendAuth();
      }
      return;
    }

    try {
      const url = this.getUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.sendAuth();
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emit(payload.type, payload.data || payload);
        } catch (err) {
          console.error('[ws] error parsing message:', err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        // Handled via onclose
      };
    } catch (err) {
      console.error('[ws] error creating connection:', err);
      this.scheduleReconnect();
    }
  }

  sendAuth() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentUser) {
      this.socket.send(
        JSON.stringify({
          type: 'authenticate',
          userId: this.currentUser._id,
          role: this.currentUser.role,
        })
      );
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed) {
        this.connect(this.currentUser);
      }
    }, delay);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(event);
      }
    };
  }

  emit(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error('[ws] error in subscriber callback:', err);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
