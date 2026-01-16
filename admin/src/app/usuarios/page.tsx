"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Protected from "@/lib/Protected";
import Card from "@/components/ui/Card";
import Table, { Th, Td } from "@/components/ui/Table";
import { TrashIcon } from "@heroicons/react/24/outline";

type User = { id: number; email: string; role: string; fullName?: string; verified: boolean };

export default function AdminUsuarios() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setLoading(false); return; }
    setError(null);
    apiFetch<User[]>('/users')
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error cargando usuarios'))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(id: number, role: string) {
    try {
      const updated = await apiFetch<{ role: string }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) });
      setItems(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
    } catch {
      alert('No se pudo actualizar el rol');
    }
  }

  async function deleteUser(id: number) {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(u => u.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
    }
  }

  return (
    <Protected>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Estado</Th>
                  <Th>Rol</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><Td className="p-3" colSpan={6}>Cargando...</Td></tr>
                ) : error ? (
                  <tr><Td className="p-3 text-red-600" colSpan={6}>{error}</Td></tr>
                ) : items.length === 0 ? (
                  <tr><Td className="p-3" colSpan={6}>No hay usuarios</Td></tr>
                ) : items.map(u => (
                  <tr key={u.id}>
                    <Td>{u.id}</Td>
                    <Td>{u.fullName || '-'}</Td>
                    <Td>{u.email}</Td>
                    <Td>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.verified 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {u.verified ? 'Verificado' : 'Pendiente'}
                      </span>
                    </Td>
                    <Td>{u.role}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <select 
                          className="border rounded px-2 py-1 text-sm bg-white dark:bg-[#0f1115] text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500" 
                          value={u.role} 
                          onChange={(e) => changeRole(u.id, e.target.value)}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="VENDEDOR">VENDEDOR</option>
                          <option value="CLIENTE">CLIENTE</option>
                        </select>
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar usuario"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </Td>
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

