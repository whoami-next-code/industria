"use client";
import { useEffect, useState } from "react";
import Protected from "@/lib/Protected";
import { apiFetch } from "@/lib/api";
import Card from "@/components/ui/Card";
import Table, { Th, Td } from "@/components/ui/Table";

type User = { id: number; email: string; role: string; fullName?: string; verified?: boolean; createdAt?: string };

export default function AdminClientesPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    apiFetch<User[]>('/users?role=CLIENTE&verified=1')
      .then((data) => {
        const clientes = Array.isArray(data) ? data.filter(u => (u.role ?? '').toUpperCase() === 'CLIENTE') : [];
        setItems(clientes);
        if (clientes.length === 0) {
          console.warn('[AdminClientes] No hay clientes para mostrar');
        } else {
          console.table(clientes.map(c => ({ id: c.id, email: c.email, verified: c.verified, fullName: c.fullName })));
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error cargando clientes';
        console.error('[AdminClientes] Error cargando clientes', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Clientes</h1>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Verificado</Th>
                  <Th>Creado</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><Td colSpan={5}>Cargando...</Td></tr>
                ) : error ? (
                  <tr><Td colSpan={5} className="text-red-600">{error}</Td></tr>
                ) : items.length === 0 ? (
                  <tr><Td colSpan={5}>No hay clientes</Td></tr>
                ) : items.map(u => (
                  <tr key={u.id}>
                    <Td>{u.id}</Td>
                    <Td>{u.fullName || '-'}</Td>
                    <Td>{u.email}</Td>
                    <Td>{u.verified ? 'Sí' : 'No'}</Td>
                    <Td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </Protected>
  );
}
