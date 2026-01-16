import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

export function createAdminSocket(token: string): Socket {
  return io(`${API_URL}/ws/admin`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    query: { token },
  });
}

