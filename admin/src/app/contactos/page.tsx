"use client";
import React, { useEffect, useState } from "react";
import Protected from "@/lib/Protected";
import { apiFetch } from "@/lib/api";

type Contacto = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
  productoId?: number;
  estado: "nuevo" | "en_proceso" | "atendido" | "cancelado";
  creadoEn: string;
};

const ESTADOS: Contacto["estado"][] = ["nuevo", "en_proceso", "atendido", "cancelado"];

export default function AdminContactosPage() {
  const [items, setItems] = useState<Contacto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  const cargar = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setCargando(true);
    setError(null);
    try {
      const data = await apiFetch<Contacto[]>("/contactos");
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar contactos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const actualizarEstado = async (id: number, estado: Contacto["estado"]) => {
    setActualizandoId(id);
    try {
      await apiFetch(`/contactos/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      await cargar();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error actualizando estado");
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <Protected>
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Contactos de usuarios</h1>
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {cargando ? (
        <div>Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Teléfono</th>
                <th className="p-2 border">Producto</th>
                <th className="p-2 border">Mensaje</th>
                <th className="p-2 border">Estado</th>
                <th className="p-2 border">Creado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="p-2 border text-sm">{c.id}</td>
                  <td className="p-2 border text-sm">{c.nombre}</td>
                  <td className="p-2 border text-sm">{c.email}</td>
                  <td className="p-2 border text-sm">{c.telefono || "-"}</td>
                  <td className="p-2 border text-sm">{c.productoId ?? "-"}</td>
                  <td className="p-2 border text-sm max-w-xs break-words">{c.mensaje}</td>
                  <td className="p-2 border text-sm">
                    <select
                      className="border rounded p-1"
                      value={c.estado}
                      onChange={(e) => actualizarEstado(c.id, e.target.value as Contacto["estado"]) }
                      disabled={actualizandoId === c.id}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border text-sm">{new Date(c.creadoEn).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </Protected>
  );
}
