import { WebSocketServer, WebSocket } from 'ws';

// Map of userId -> Set<WebSocket>
const userSockets = new Map();
// Map of role -> Set<WebSocket>
const roleSockets = new Map();
// All active sockets
const allSockets = new Set();

let wss = null;

function safeSend(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(payload));
    } catch (err) {
      console.error('[ws] error sending payload:', err.message);
    }
  }
}

function registerUserSocket(socket, userId, role) {
  if (!userId) return;
  const uid = String(userId);
  socket.userId = uid;
  socket.role = role || 'user';

  if (!userSockets.has(uid)) {
    userSockets.set(uid, new Set());
  }
  userSockets.get(uid).add(socket);

  if (role) {
    if (!roleSockets.has(role)) {
      roleSockets.set(role, new Set());
    }
    roleSockets.get(role).add(socket);
  }
}

function unregisterSocket(socket) {
  allSockets.delete(socket);

  if (socket.userId) {
    const set = userSockets.get(socket.userId);
    if (set) {
      set.delete(socket);
      if (set.size === 0) userSockets.delete(socket.userId);
    }
  }

  if (socket.role) {
    const set = roleSockets.get(socket.role);
    if (set) {
      set.delete(socket);
      if (set.size === 0) roleSockets.delete(socket.role);
    }
  }
}

export function initWebSocketServer(httpServer) {
  if (wss) return wss;

  wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (pathname === '/ws' || pathname === '/api/v1/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (socket, request) => {
    allSockets.add(socket);

    // Initial greeting
    safeSend(socket, {
      type: 'connection:established',
      message: 'Connected to Real-time Notification Service',
      timestamp: new Date().toISOString(),
    });

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'authenticate' || msg.type === 'auth') {
          registerUserSocket(socket, msg.userId, msg.role);
          safeSend(socket, {
            type: 'authenticated',
            userId: msg.userId,
            role: msg.role,
          });
        } else if (msg.type === 'ping') {
          safeSend(socket, { type: 'pong', timestamp: Date.now() });
        }
      } catch (err) {
        console.error('[ws] error handling message:', err.message);
      }
    });

    socket.on('close', () => {
      unregisterSocket(socket);
    });

    socket.on('error', () => {
      unregisterSocket(socket);
    });
  });

  console.log('[ws] WebSocket server initialized on /ws');
  return wss;
}

export function notifyUser(userId, notification) {
  if (!userId) return;
  const uid = String(userId);
  const sockets = userSockets.get(uid);
  if (!sockets || sockets.size === 0) return;

  const payload = {
    type: 'notification:new',
    data: notification,
    timestamp: new Date().toISOString(),
  };

  sockets.forEach((socket) => safeSend(socket, payload));
}

export function notifyLeaveUpdate(userId, application) {
  if (!userId) return;
  const uid = String(userId);
  const sockets = userSockets.get(uid);
  if (!sockets || sockets.size === 0) return;

  const payload = {
    type: 'leave:update',
    data: application,
    timestamp: new Date().toISOString(),
  };

  sockets.forEach((socket) => safeSend(socket, payload));
}

export function notifyAdmins(event, data) {
  const adminSet = roleSockets.get('admin');
  if (!adminSet || adminSet.size === 0) return;

  const payload = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
  };

  adminSet.forEach((socket) => safeSend(socket, payload));
}

export function broadcastAll(event, data) {
  const payload = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
  };

  allSockets.forEach((socket) => safeSend(socket, payload));
}
