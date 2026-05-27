import api from './api';

const RECORD_SEPARATOR = String.fromCharCode(0x1e);
const RECONNECT_DELAY_MS = 5000;

let socket = null;
let reconnectTimer = null;
let shouldReconnect = false;
const listeners = new Set();

const getHubUrl = () => api.baseURL.replace(/\/api\/?$/i, '/hub');

const getWebSocketUrl = (hubUrl, connectionToken) => {
  const url = new URL(hubUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('id', connectionToken);
  if (api.token) {
    url.searchParams.set('access_token', api.token);
  }
  return url.toString();
};

const emit = (payload) => {
  listeners.forEach((listener) => listener(payload));
};

const scheduleReconnect = () => {
  if (!shouldReconnect || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startRealtime();
  }, RECONNECT_DELAY_MS);
};

const connect = async () => {
  if (!api.token || socket) return;

  const hubUrl = getHubUrl();
  const negotiate = await fetch(`${hubUrl}/negotiate?negotiateVersion=1`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${api.token}`,
    },
  });

  if (!negotiate.ok) return;

  const data = await negotiate.json();
  const connectionToken = data.connectionToken || data.connectionId;
  if (!connectionToken) return;

  socket = new WebSocket(getWebSocketUrl(hubUrl, connectionToken));

  socket.onopen = () => {
    socket?.send(JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEPARATOR);
  };

  socket.onmessage = (event) => {
    String(event.data || '')
      .split(RECORD_SEPARATOR)
      .filter(Boolean)
      .forEach((raw) => {
        try {
          const message = JSON.parse(raw);
          if (
            message.type === 1 &&
            (message.target === 'AppStateChanged' || message.target === 'UserStateChanged')
          ) {
            emit(message.arguments?.[0]);
          }
        } catch {
          // SignalR keep-alive and handshake frames are safe to ignore.
        }
      });
  };

  socket.onerror = () => {
    socket?.close();
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
};

export const startRealtime = async () => {
  shouldReconnect = true;
  try {
    await connect();
  } catch {
    scheduleReconnect();
  }
};

export const stopRealtime = () => {
  shouldReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    const current = socket;
    socket = null;
    current.close();
  }
};

export const onRealtimeEvent = (handler) => {
  listeners.add(handler);
  return () => listeners.delete(handler);
};
