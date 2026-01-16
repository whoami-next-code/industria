"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Protected from "@/lib/Protected";
import Card from "@/components/ui/Card";
import Table, { Th, Td } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/modals/Modal";

type Order = { 
  id: number; 
  status: string; 
  total: number; 
  createdAt: string;
  userId?: number;
  notes?: string;
  cliente?: { nombre: string; email?: string };
  items?: Array<{ producto: { nombre: string }; cantidad: number; precio: number }>;
};

type Avance = {
  fecha: string;
  mensaje: string;
  estado?: string;
  tecnico?: string;
};

type Evidencia = {
  fecha: string;
  archivos: string[];
  tipos: string[];
  comentarios: string[];
};

export default function AdminPedidos() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setLoading(false); return; }
    setError(null);
    apiFetch<Order[]>('/pedidos')
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error cargando pedidos'))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      const updated = await apiFetch<{ status: string }>(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setItems(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
      if (selected && selected.id === id) {
        setSelected({ ...selected, status: updated.status });
      }
    } catch {
      alert('No se pudo actualizar el estado');
    }
  }

  async function openDetail(order: Order) {
    setSelected(order);
    setDetailLoading(true);
    setAvances([]);
    setEvidencias([]);
    
    try {
      const detail = await apiFetch<Order>(`/pedidos/${order.id}`);
      setSelected(detail);
      
      // Parsear avances y evidencias desde notes
      if (detail.notes) {
        try {
          const notes = JSON.parse(detail.notes);
          if (notes.avances && Array.isArray(notes.avances)) {
            setAvances(notes.avances);
          }
          if (notes.evidencias && Array.isArray(notes.evidencias)) {
            setEvidencias(notes.evidencias);
          }
        } catch (e) {
          console.warn('Error parsing notes:', e);
        }
      }
    } catch (err) {
      console.error('Error loading detail:', err);
      alert('Error al cargar el detalle del pedido');
    } finally {
      setDetailLoading(false);
    }
  }

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  function formatMoney(amount: number) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  return (
    <Protected>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Cliente</Th>
                  <Th>Estado</Th>
                  <Th>Total</Th>
                  <Th>Fecha</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><Td className="p-3" colSpan={6}>Cargando...</Td></tr>
                ) : error ? (
                  <tr><Td className="p-3 text-red-600" colSpan={6}>{error}</Td></tr>
                ) : items.length === 0 ? (
                  <tr><Td className="p-3" colSpan={6}>No hay pedidos</Td></tr>
                ) : items.map(o => (
                  <tr key={o.id}>
                    <Td>#{o.id}</Td>
                    <Td>{o.cliente?.nombre || 'N/A'}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === 'COMPLETADO' 
                          ? 'bg-green-100 text-green-800'
                          : o.status === 'ENVIADO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {o.status}
                      </span>
                    </Td>
                    <Td>{formatMoney(o.total)}</Td>
                    <Td>{formatDate(o.createdAt)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="text-xs" onClick={() => openDetail(o)}>
                          Ver detalle
                        </Button>
                        {o.status !== 'ENVIADO' && (
                          <button 
                            onClick={() => updateStatus(o.id, 'ENVIADO')} 
                            className="text-xs text-blue-500 hover:text-blue-400"
                          >
                            Enviado
                          </button>
                        )}
                        {o.status !== 'COMPLETADO' && (
                          <button 
                            onClick={() => updateStatus(o.id, 'COMPLETADO')} 
                            className="text-xs text-green-500 hover:text-green-400"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Modal 
          isOpen={!!selected} 
          onClose={() => setSelected(null)} 
          title={`Pedido #${selected?.id ?? ""}`} 
          size="xl"
        >
          {detailLoading || !selected ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="space-y-6">
              {/* Información básica */}
              <Card title="Información del Pedido">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selected.status === 'COMPLETADO' 
                        ? 'bg-green-100 text-green-800'
                        : selected.status === 'ENVIADO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Total:</span>
                    <span className="ml-2">{formatMoney(selected.total)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Fecha:</span>
                    <span className="ml-2">{formatDate(selected.createdAt)}</span>
                  </div>
                  {selected.cliente && (
                    <div>
                      <span className="font-semibold text-gray-600">Cliente:</span>
                      <span className="ml-2">{selected.cliente.nombre}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Items del pedido */}
              {selected.items && selected.items.length > 0 && (
                <Card title="Productos">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Producto</th>
                          <th className="text-right p-2">Cantidad</th>
                          <th className="text-right p-2">Precio</th>
                          <th className="text-right p-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{item.producto?.nombre || 'N/A'}</td>
                            <td className="text-right p-2">{item.cantidad}</td>
                            <td className="text-right p-2">{formatMoney(item.precio)}</td>
                            <td className="text-right p-2">{formatMoney(item.cantidad * item.precio)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Avances desde la app Flutter */}
              <Card title="Avances de Producción">
                {avances.length > 0 ? (
                  <ul className="space-y-4">
                    {avances.map((avance, idx) => (
                      <li key={idx} className="flex gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900">{avance.mensaje || avance.message || 'Sin mensaje'}</span>
                            {avance.estado && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200 text-gray-700">
                                {avance.estado}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(avance.fecha)}
                            {avance.tecnico && ` · Técnico: ${avance.tecnico}`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm">Sin avances registrados desde la app móvil.</p>
                )}
              </Card>

              {/* Evidencias desde la app Flutter */}
              <Card title="Evidencias">
                {evidencias.length > 0 ? (
                  <div className="space-y-4">
                    {evidencias.map((evidencia, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-2">
                          {formatDate(evidencia.fecha)}
                        </div>
                        {evidencia.archivos && evidencia.archivos.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-gray-700">Archivos:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                              {evidencia.archivos.map((archivo, aIdx) => (
                                <li key={aIdx}>{archivo}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evidencia.tipos && evidencia.tipos.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-gray-700">Tipos:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {evidencia.tipos.map((tipo, tIdx) => (
                                <span key={tIdx} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                  {tipo}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {evidencia.comentarios && evidencia.comentarios.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Comentarios:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                              {evidencia.comentarios.filter(c => c && c.trim()).map((comentario, cIdx) => (
                                <li key={cIdx}>{comentario}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Sin evidencias registradas desde la app móvil.</p>
                )}
              </Card>

              {/* Acciones */}
              <div className="flex gap-2 justify-end">
                {selected.status !== 'ENVIADO' && (
                  <Button onClick={() => {
                    updateStatus(selected.id, 'ENVIADO');
                  }}>
                    Marcar como Enviado
                  </Button>
                )}
                {selected.status !== 'COMPLETADO' && (
                  <Button variant="primary" onClick={() => {
                    updateStatus(selected.id, 'COMPLETADO');
                  }}>
                    Marcar como Completado
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Protected>
  );
}

