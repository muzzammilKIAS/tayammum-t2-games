import { io } from 'socket.io-client';

/** Sambungan Socket.IO dengan permintaan berasaskan janji dan status sambungan. */
export function connect({ onStatus } = {}) {
  const socket = io({ transports: ['polling', 'websocket'], reconnectionDelayMax: 4000 });
  socket.on('connect', () => onStatus?.('online'));
  socket.on('disconnect', () => onStatus?.('offline'));
  socket.io.on('reconnect_attempt', () => onStatus?.('reconnecting'));
  const request = (event, data = {}) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Pelayan tidak memberi respons. Semak sambungan internet.')), 8000);
    socket.emit(event, data, res => { clearTimeout(timer); res?.ok ? resolve(res) : reject(new Error(res?.error || 'Ralat tidak diketahui.')); });
  });
  return { socket, request };
}
