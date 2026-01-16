'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createAdminSocket } from './socket';

type AdminSocketContextType = {
  socket: Socket | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastEvent?: { name: string; data: unknown };
};

const AdminSocketContext = createContext<AdminSocketContextType>({ socket: null, status: 'disconnected' });

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<AdminSocketContextType['status']>('disconnected');
  const [lastEvent, setLastEvent] = useState<{ name: string; data: unknown }>();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    if (!token) return;
    setStatus('connecting');
    const s = createAdminSocket(token);
    setSocket(s);
    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));
    s.on('connect_error', () => setStatus('error'));
    s.on('status', (d) => setLastEvent({ name: 'status', data: d }));
    s.on('productos.updated', (d) => setLastEvent({ name: 'productos.updated', data: d }));
    s.on('pedidos.updated', (d) => setLastEvent({ name: 'pedidos.updated', data: d }));
    s.on('cotizaciones.updated', (d) => setLastEvent({ name: 'cotizaciones.updated', data: d }));
    return () => { s.disconnect(); };
  }, []);

  const value = useMemo(() => ({ socket, status, lastEvent }), [socket, status, lastEvent]);
  return <AdminSocketContext.Provider value={value}>{children}</AdminSocketContext.Provider>;
}

export function useAdminSocket() {
  return useContext(AdminSocketContext);
}
