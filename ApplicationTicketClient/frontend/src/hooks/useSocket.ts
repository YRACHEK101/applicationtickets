// src/socket.ts
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://10.10.12.18:5000', {
  withCredentials: true, // if needed for authentication
});

export default socket;
