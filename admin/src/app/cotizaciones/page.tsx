"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type React from "react";
import { apiFetch } from "@/lib/api";
import Protected from "@/lib/Protected";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table, { Th, Td } from "@/components/ui/Table";
import Modal from "@/components/modals/Modal";
import { useAdminSocket } from "@/lib/AdminSocketProvider";

type QuoteStatus =
  | "PENDIENTE"
  | "APROBADA"
  | "PRODUCCION"
  | "INSTALACION"
  | "FINALIZADA"
  | "CANCELADA"
  | "NUEVA"
  | "EN_PROCESO"
  | "ENVIADA"
  | "ENTREGADA"
  | "COMPLETADA"
  | string;

type QuoteItem = {
  productId?: number;
  name?: string;
  quantity: number;
  materials?: string;
  measures?: string;
  observations?: string;
  imageUrl?: string;
};

type QuotationImage = {
  id: string;
  quotationId: number;
  userId: string;
  image_url: string;
  is_approved: boolean;
  uploaded_at: string;
  user?: {
    email: string;
    fullName?: string;
  };
};

type MaterialUsage = {
  name: string;
  quantity: number;
  unit: string;
  provider?: string;
};

type ProgressUpdate = {
  message: string;
  status?: QuoteStatus;
  estimatedDate?: string;
  attachmentUrls?: string[];
  materials?: string;
  materialList?: MaterialUsage[];
  createdAt: string;
  author?: string;
  channel?: string;
  progressPercent?: number;
  milestone?:
    | "INICIO"
    | "APROBADA"
    | "PRODUCCION"
    | "INSTALACION"
    | "ENTREGA"
    | "CIERRE";
  technician?: string;
  highlighted?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
};

type Quote = {
  id: number;
  code?: string;
  orderId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerDocument?: string;
  customerAddress?: string;
  items: QuoteItem[];
  status: QuoteStatus;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  need?: string;
  estimatedDate?: string;
  estimatedDeliveryDate?: string;
  startDate?: string;
  estimatedCompletionDate?: string;
  completionDate?: string;
  installationDate?: string;
  budget?: string;
  totalAmount?: number;
  preferredChannel?: string;
  technicianName?: string;
  technicianId?: number;
  installationTechnician?: string;
  technicianSignature?: string;
  notes?: string;
  clientMessage?: string;
  lastUpdateMessage?: string;
  progressPercent?: number;
  progressUpdates?: ProgressUpdate[];
  timeline?: ProgressUpdate[];
  updatedAt: string | Date;
  createdAt: string | Date;
};

type TechnicianWorkload = {
  id: number;
  fullName: string;
  email: string;
  activeCount: number;
  status: 'DISPONIBLE' | 'EN_PROCESO' | 'SATURADO';
};

type Filters = { search: string; status: string; from: string; to: string };

type Profile = { role?: string | null };

type QuoteListResponse = {
  data: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  stats?: { byStatus?: Record<string, number>; total?: number };
};

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "PRODUCCION", label: "En producción" },
  { value: "INSTALACION", label: "Instalación" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const CLIENT_BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

function SignatureCanvas({ onSave, onClear }: { onSave: (data: string) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
        }
    }
  }, []);

  const getPos = (e: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
          x: clientX - rect.left,
          y: clientY - rect.top
      };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: any) => {
    if(isDrawing) {
        e.preventDefault();
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
          onSave(canvas.toDataURL());
        }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="border border-gray-300 rounded inline-block bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="cursor-crosshair touch-none block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
         <span>Firme en el recuadro superior</span>
         <button onClick={() => {
             const canvas = canvasRef.current;
             const ctx = canvas?.getContext('2d');
             if(ctx && canvas) {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 onClear();
             }
        }} className="text-red-500 hover:text-red-700 font-medium">Borrar Firma</button>
      </div>
    </div>
  );
}

function AssignmentModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  technicians 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAssign: (techId: number) => void; 
  technicians: TechnicianWorkload[] 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignación Inteligente de Personal">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">Seleccione un técnico disponible para asignar a esta cotización. El sistema sugiere personal basado en su carga actual.</p>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        {technicians.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
            No se encontraron técnicos registrados con el rol TECNICO.
          </div>
        ) : (
          technicians.map(tech => (
            <div key={tech.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{tech.fullName || tech.email}</span>
                <div className="flex flex-col md:flex-row items-center gap-2 mb-4 text-xs mt-1">
                   <span className={`px-2 py-0.5 rounded-full font-medium ${
                     tech.status === 'DISPONIBLE' ? 'bg-green-100 text-green-700' :
                     tech.status === 'SATURADO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                   }`}>
                     {tech.status}
                   </span>
                   <span className="text-gray-500">• {tech.activeCount} tareas en curso</span>
                </div>
              </div>
              <Button 
                variant={tech.status === 'SATURADO' ? 'ghost' : 'primary'}
                onClick={() => onAssign(tech.id)}
                className="text-sm py-1 h-8"
              >
                Asignar
              </Button>
            </div>
          ))
        )}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCotizaciones() {
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canView, setCanView] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [images, setImages] = useState<QuotationImage[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianWorkload[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { lastEvent } = useAdminSocket();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [apiStats, setApiStats] = useState<{ byStatus?: Record<string, number>; total?: number } | null>(null);
  const [progressForm, setProgressForm] = useState({
    message: "",
    status: "" as QuoteStatus | "",
    estimatedDate: "",
    progressPercent: "",
    technicianName: "",
    attachmentUrls: "",
    materials: "",
    materialList: [] as MaterialUsage[],
    technicianSignature: "",
  });

  // Prefill el formulario de avance con el último progreso registrado (incluye adjuntos y materiales)
  useEffect(() => {
    if (!selected) {
      setProgressForm({
        message: "",
        status: "" as QuoteStatus | "",
        estimatedDate: "",
        progressPercent: "",
        technicianName: "",
        attachmentUrls: "",
        materials: "",
        materialList: [],
        technicianSignature: "",
      });
      return;
    }

    const last =
      (selected.progressUpdates && selected.progressUpdates[0]) ||
      (selected.timeline && selected.timeline[0]);

    if (!last) return;

    setProgressForm({
      message: last.message || "",
      status: (last.status as QuoteStatus) || (selected.status as QuoteStatus) || "",
      estimatedDate: last.estimatedDate ?? "",
      progressPercent:
        last.progressPercent !== undefined && last.progressPercent !== null
          ? String(last.progressPercent)
          : "",
      technicianName: last.technician ?? selected.technicianName ?? "",
      attachmentUrls: (last.attachmentUrls ?? []).join("\n"),
      materials: last.materials ?? "",
      materialList: last.materialList ?? [],
      technicianSignature: selected.technicianSignature ?? "",
    });
  }, [selected]);

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const loadQuotes = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filters.status) qs.append("status", filters.status);
      if (filters.search) qs.append("q", filters.search);
      if (filters.from) qs.append("from", filters.from);
      if (filters.to) qs.append("to", filters.to);
      qs.append("page", String(page));
      qs.append("limit", String(pageSize));
      const url = `/cotizaciones${qs.toString() ? `?${qs.toString()}` : ""}`;
      const data = await apiFetch<Quote[] | QuoteListResponse>(url);
      setApiStats(null);

      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      } else if (data && typeof data === "object") {
        const list = Array.isArray((data as QuoteListResponse).data) ? (data as QuoteListResponse).data : [];
        const totalFromApi = Number((data as QuoteListResponse).total ?? list.length) || 0;
        const pageFromApi = Number((data as QuoteListResponse).page ?? page) || page;
        const pageSizeFromApi = Number((data as QuoteListResponse).pageSize ?? pageSize) || pageSize;
        const statsFromApi = (data as QuoteListResponse).stats;

        setItems(list);
        setTotal(totalFromApi);
        if (statsFromApi) {
          setApiStats({ ...statsFromApi, total: statsFromApi.total ?? totalFromApi });
        }
        if (pageFromApi !== page) setPage(pageFromApi);
        if (pageSizeFromApi !== pageSize) setPageSize(pageSizeFromApi);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando cotizaciones";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [canView, filters.from, filters.search, filters.status, filters.to, page, pageSize]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<Profile>("/auth/profile")
      .then((p) => {
        const allowed = p?.role === "ADMIN" || p?.role === "VENDEDOR";
        setCanView(allowed);
        if (!allowed) {
          setError("No tienes permisos para ver cotizaciones. Contacta a un administrador.");
          setLoading(false);
          return;
        }
        loadQuotes();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "No se pudo validar el usuario";
        setError(msg);
        setLoading(false);
      });
  }, [loadQuotes]);

  useEffect(() => {
    if (lastEvent?.name === 'cotizaciones.updated') {
      loadQuotes();
      if (selected) {
        const data = lastEvent.data as any;
        if (data && (data.id === selected.id || data.id === Number(selected.id))) {
           if (data.action === 'delete') {
             setSelected(null);
           } else {
             // Recargar detalle
             openDetail(selected); 
           }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  function statusColors(status: QuoteStatus) {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      PENDIENTE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
      APROBADA: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      PRODUCCION: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
      INSTALACION: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
      FINALIZADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      CANCELADA: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      NUEVA: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
      EN_PROCESO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      ENVIADA: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
      ENTREGADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      COMPLETADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    };
    return map[status] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
  }

  function statusToPercent(status?: QuoteStatus) {
    const normalized = (status || "").toUpperCase();
    switch (normalized) {
      case "PENDIENTE":
      case "NUEVA":
        return 5;
      case "APROBADA":
      case "EN_PROCESO":
        return 20;
      case "PRODUCCION":
      case "EN_PRODUCCION":
        return 55;
      case "INSTALACION":
        return 85;
      case "FINALIZADA":
      case "COMPLETADA":
      case "ENTREGADA":
        return 100;
      default:
        return 10;
    }
  }

  function formatDate(date?: string | Date | null) {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMoney(num?: number | string | null) {
    if (num === null || num === undefined) return "S/ 0.00";
    const value = Number(num);
    if (!Number.isFinite(value)) return "S/ 0.00";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(value);
  }

  async function fetchImages(quotationId: number) {
    setImageLoading(true);
    try {
      const data = await apiFetch<QuotationImage[]>(`/cotizaciones/${quotationId}/images`);
      setImages(data || []);
    } catch (err) {
      console.error("Error cargando imágenes", err);
    } finally {
      setImageLoading(false);
    }
  }

  async function loadWorkload() {
    try {
      const data = await apiFetch<TechnicianWorkload[]>('/cotizaciones/workload');
      setTechnicians(data || []);
    } catch (err) {
      console.error("Error loading workload", err);
    }
  }

  async function handleAssign(techId: number) {
    if (!selected) return;
    try {
      await apiFetch(`/cotizaciones/${selected.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ technicianId: techId })
      });
      setShowAssignModal(false);
      await loadQuotes();
      if (selected) openDetail({ ...selected, technicianId: techId }); // Refresh selected roughly
      alert('Técnico asignado correctamente');
    } catch (err) {
      alert('Error al asignar técnico');
    }
  }

  async function approveUpdate(updateIndex: number) {
    if (!selected) return;
    if (!confirm('¿Aprobar esta etapa y permitir el avance?')) return;
    try {
      await apiFetch(`/cotizaciones/${selected.id}/approve/${updateIndex}`, { method: 'PUT' });
      openDetail(selected); // Reload detail
      alert('Etapa aprobada');
    } catch (err) {
      alert('Error al aprobar etapa');
    }
  }

  async function rejectUpdate(updateIndex: number) {
    if (!selected) return;
    const reason = prompt('Motivo del rechazo (se notificará al técnico):');
    if (!reason) return;
    try {
      await apiFetch(`/cotizaciones/${selected.id}/reject/${updateIndex}`, { 
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
      openDetail(selected); // Reload detail
      alert('Etapa rechazada');
    } catch (err) {
      alert('Error al rechazar etapa');
    }
  }

  async function approveImage(imageId: number) {
    try {
      await apiFetch(`/cotizaciones/images/${imageId}/approve`, { method: "PUT" });
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, is_approved: true } : img))
      );
    } catch (err) {
      alert("Error al aprobar imagen");
    }
  }

  async function rejectImage(imageId: number) {
    if (!confirm("¿Estás seguro de rechazar esta imagen?")) return;
    try {
      await apiFetch(`/cotizaciones/images/${imageId}/reject`, { method: "PUT" });
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, is_approved: false } : img))
      );
    } catch (err) {
      alert("Error al rechazar imagen");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setImageLoading(true);
      // We need to use raw fetch or adapt apiFetch for FormData if it doesn't support it automatically
      // Assuming apiFetch handles JSON, for FormData we might need to bypass or adjust content-type
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/cotizaciones/${selected.id}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' // Do NOT set this manually, browser does it with boundary
        },
        body: formData,
      });
      
      if (!res.ok) throw new Error("Error subiendo imagen");
      
      await fetchImages(selected.id);
      alert("Imagen subida correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen");
    } finally {
      setImageLoading(false);
      // Clear input
      e.target.value = "";
    }
  }

  async function openDetail(q: Quote) {
    setDetailLoading(true);
    try {
      const detail = await apiFetch<Quote>(`/cotizaciones/${q.id}/reporte`).catch(() =>
        apiFetch<Quote>(`/cotizaciones/${q.id}`),
      );
      const normalized: Quote = {
        ...detail,
        progressUpdates: detail.progressUpdates ?? (detail as any)?.timeline ?? [],
      };
      setSelected(normalized);
      fetchImages(normalized.id);
    } catch (err) {
      console.error(err);
      setSelected(q);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const payload: Partial<ProgressUpdate> & {
      status?: QuoteStatus;
      technicianSignature?: string;
    } = {
      message: progressForm.message,
      status: progressForm.status || undefined,
      estimatedDate: progressForm.estimatedDate || undefined,
      progressPercent: progressForm.progressPercent
        ? parseInt(progressForm.progressPercent, 10)
        : undefined,
      technician: progressForm.technicianName || undefined,
      attachmentUrls: progressForm.attachmentUrls.split("\n").filter(Boolean),
      materials: progressForm.materials || undefined,
      materialList: progressForm.materialList,
      technicianSignature: progressForm.technicianSignature || undefined,
    };

    try {
      await apiFetch(`/cotizaciones/${selected.id}/progress`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("Progreso actualizado");
      openDetail(selected); // Recargar
      loadQuotes(); // Recargar lista
    } catch (err: any) {
      alert(`Error: ${err.message || "No se pudo actualizar el progreso"}`);
    }
  }

  const stats = useMemo(() => {
    if (apiStats) {
      return {
        PENDIENTE: apiStats.byStatus?.PENDIENTE ?? 0,
        PRODUCCION: apiStats.byStatus?.PRODUCCION ?? 0,
        INSTALACION: apiStats.byStatus?.INSTALACION ?? 0,
        FINALIZADA: apiStats.byStatus?.FINALIZADA ?? 0,
        TOTAL: apiStats.total ?? 0,
      };
    }
    // Fallback a cálculo en cliente si el API no lo provee
    return items.reduce(
      (acc, q) => {
        const s = (q.status || "PENDIENTE").toUpperCase();
        if (s === "PENDIENTE") acc.PENDIENTE++;
        if (s === "PRODUCCION") acc.PRODUCCION++;
        if (s === "INSTALACION") acc.INSTALACION++;
        if (s === "FINALIZADA") acc.FINALIZADA++;
        acc.TOTAL++;
        return acc;
      },
      { PENDIENTE: 0, PRODUCCION: 0, INSTALACION: 0, FINALIZADA: 0, TOTAL: 0 },
    );
  }, [items, apiStats]);

  const exportToPDF = () => {
    if (!selected) return;
    
    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF.default();
        const title = `Reporte de Cotización: ${selected.code || `#${selected.id}`}`;
        const clientInfo = `Cliente: ${selected.customerName} (${selected.customerEmail})`;
        const statusInfo = `Estado Actual: ${selected.status}`;
        
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.text(clientInfo, 14, 30);
        doc.text(statusInfo, 14, 36);

        const tableData = selected.timeline?.map(p => [
          formatDate(p.createdAt),
          p.author || 'Sistema',
          p.message,
          p.status || '',
        ]) || [];

        (doc as any).autoTable({
          startY: 45,
          head: [['Fecha', 'Autor', 'Descripción', 'Nuevo Estado']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
        });

        let finalY = (doc as any).lastAutoTable.finalY || 80;

        // Añadir lista de materiales si existen
        const allMaterials = selected.timeline?.flatMap(t => t.materialList || []) || [];
        if (allMaterials.length > 0) {
          doc.setFontSize(14);
          doc.text("Materiales Utilizados", 14, finalY + 10);
          const materialData = allMaterials.map(m => [m.name, m.quantity, m.unit, m.provider || 'N/A']);
          (doc as any).autoTable({
            startY: finalY + 15,
            head: [['Material', 'Cantidad', 'Unidad', 'Proveedor']],
            body: materialData,
          });
          finalY = (doc as any).lastAutoTable.finalY;
        }

        // Añadir firma si existe
        if (selected.technicianSignature) {
          doc.setFontSize(12);
          doc.text("Firma del Técnico:", 14, finalY + 15);
          doc.addImage(selected.technicianSignature, 'PNG', 14, finalY + 20, 100, 40);
        }

        doc.save(`reporte_${selected.code || selected.id}.pdf`);
      });
    });
  };

  return (
    <Protected>
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Operaciones</h1>
            <p className="text-gray-500 mt-1">
              Visualiza, actualiza estados, registra avances y abre el seguimiento del cliente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadQuotes} variant="secondary">
              Refrescar
            </Button>
            {selected && (
              <Button onClick={exportToPDF} variant="primary">
                Exportar PDF
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <h3 className="text-gray-500 font-medium">Cotizaciones Totales</h3>
            <p className="text-3xl font-bold">{loading ? "..." : stats.TOTAL}</p>
          </Card>
          <Card>
            <h3 className="text-gray-500 font-medium">Pendientes</h3>
            <p className="text-3xl font-bold">{loading ? "..." : stats.PENDIENTE}</p>
          </Card>
          <Card>
            <h3 className="text-gray-500 font-medium">En Producción</h3>
            <p className="text-3xl font-bold">{loading ? "..." : stats.PRODUCCION}</p>
          </Card>
          <Card>
            <h3 className="text-gray-500 font-medium">Instalación</h3>
            <p className="text-3xl font-bold">{loading ? "..." : stats.INSTALACION}</p>
          </Card>
          <Card>
            <h3 className="text-gray-500 font-medium">Finalizadas</h3>
            <p className="text-3xl font-bold">{loading ? "..." : stats.FINALIZADA}</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar por código, cliente o..."
              className="p-2 border rounded w-full md:w-1/3"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
            <select
              className="p-2 border rounded w-full md:w-auto"
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="p-2 border rounded"
              value={filters.from}
              onChange={(e) => updateFilters({ from: e.target.value })}
            />
            <input
              type="date"
              className="p-2 border rounded"
              value={filters.to}
              onChange={(e) => updateFilters({ to: e.target.value })}
            />
          </div>

          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Código</Th>
                      <Th>Cliente</Th>
                      <Th>Estado</Th>
                      <Th className="hidden md:table-cell">Avance</Th>
                      <Th className="hidden lg:table-cell">Fechas</Th>
                      <Th className="hidden md:table-cell">Monto</Th>
                      <Th className="hidden xl:table-cell">Técnico</Th>
                      <Th className="hidden xl:table-cell">Última actualización</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <Td>
                          <div className="font-bold">{q.code || `COT-${q.id}`}</div>
                          <div className="text-xs text-gray-500">#{q.orderId}</div>
                        </Td>
                        <Td>
                          <div className="font-medium">{q.customerName}</div>
                          <div className="text-xs text-gray-500">{q.customerEmail}</div>
                        </Td>
                        <Td>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors(q.status).bg
                            } ${statusColors(q.status).text}`}
                          >
                            {q.status}
                          </span>
                        </Td>
                        <Td className="hidden md:table-cell">
                          <div className="w-24">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{
                                  width: `${q.progressPercent ?? statusToPercent(q.status)}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-center mt-1">
                              {q.progressPercent ?? statusToPercent(q.status)}%
                            </div>
                          </div>
                        </Td>
                        <Td className="hidden lg:table-cell">
                          <div className="text-xs">
                            <span className="font-semibold">Creada:</span>{" "}
                            {formatDate(q.createdAt)}
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold">Entrega:</span>{" "}
                            {formatDate(q.estimatedDeliveryDate)}
                          </div>
                        </Td>
                        <Td className="hidden md:table-cell">{formatMoney(q.totalAmount)}</Td>
                        <Td className="hidden xl:table-cell">
                          <div className="text-xs">{q.technicianName || 'No asignado'}</div>
                        </Td>
                        <Td className="hidden xl:table-cell">
                          <div className="text-xs max-w-[150px] truncate">
                            {q.lastUpdateMessage || "Sin actualizaciones"}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex gap-2">
                            <Button onClick={() => openDetail(q)} size="sm">
                              Ver detalle
                            </Button>
                            <Button
                              onClick={() => {
                                const url = `${CLIENT_BASE_URL}/mis-pedidos?order_id=${q.orderId}`;
                                window.open(url, "_blank");
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Cliente
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  Mostrando {items.length} de {total} cotizaciones
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="p-2">
                    Página {page} de {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {selected && (
          <Modal
            isOpen={!!selected}
            onClose={() => setSelected(null)}
            size="4xl"
            title={`Detalle de Cotización: ${selected.code || `#${selected.id}`}`}
          >
            {detailLoading ? (
              <p>Cargando detalles...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Formulario de Avance */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">Registrar Avance</h3>
                    <form onSubmit={handleProgressSubmit} className="space-y-4">
                      <textarea
                        placeholder="Mensaje de actualización..."
                        className="p-2 border rounded w-full"
                        value={progressForm.message}
                        onChange={(e) =>
                          setProgressForm({ ...progressForm, message: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          className="p-2 border rounded"
                          value={progressForm.status}
                          onChange={(e) =>
                            setProgressForm({
                              ...progressForm,
                              status: e.target.value as QuoteStatus,
                            })
                          }
                        >
                          <option value="">-- Mantener Estado --</option>
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Técnico Asignado"
                          className="p-2 border rounded"
                          value={progressForm.technicianName}
                          onChange={(e) =>
                            setProgressForm({
                              ...progressForm,
                              technicianName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="% Progreso (ej. 60)"
                          className="p-2 border rounded"
                          value={progressForm.progressPercent}
                          onChange={(e) =>
                            setProgressForm({
                              ...progressForm,
                              progressPercent: e.target.value,
                            })
                          }
                        />
                        <input
                          type="date"
                          className="p-2 border rounded"
                          value={progressForm.estimatedDate}
                          onChange={(e) =>
                            setProgressForm({
                              ...progressForm,
                              estimatedDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Materiales Utilizados</h4>
                        {progressForm.materialList.map((mat, idx) => (
                          <div key={idx} className="flex gap-2 mb-2 items-center">
                            <input type="text" placeholder="Nombre" value={mat.name} onChange={e => {
                              const newList = [...progressForm.materialList];
                              newList[idx].name = e.target.value;
                              setProgressForm({...progressForm, materialList: newList});
                            }} className="p-1 border rounded w-1/2"/>
                            <input type="number" placeholder="Cant." value={mat.quantity} onChange={e => {
                              const newList = [...progressForm.materialList];
                              newList[idx].quantity = Number(e.target.value);
                              setProgressForm({...progressForm, materialList: newList});
                            }} className="p-1 border rounded w-1/6"/>
                            <input type="text" placeholder="Unidad" value={mat.unit} onChange={e => {
                              const newList = [...progressForm.materialList];
                              newList[idx].unit = e.target.value;
                              setProgressForm({...progressForm, materialList: newList});
                            }} className="p-1 border rounded w-1/6"/>
                             <input type="text" placeholder="Proveedor" value={mat.provider} onChange={e => {
                              const newList = [...progressForm.materialList];
                              newList[idx].provider = e.target.value;
                              setProgressForm({...progressForm, materialList: newList});
                            }} className="p-1 border rounded w-1/4"/>
                            <button type="button" onClick={() => {
                              const newList = progressForm.materialList.filter((_, i) => i !== idx);
                              setProgressForm({...progressForm, materialList: newList});
                            }} className="text-red-500">X</button>
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={() => setProgressForm({...progressForm, materialList: [...progressForm.materialList, {name: '', quantity: 1, unit: 'u', provider: ''}]})}>
                          + Añadir Material
                        </Button>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Firma del Técnico</h4>
                        <SignatureCanvas 
                          onSave={(data) => setProgressForm({...progressForm, technicianSignature: data})}
                          onClear={() => setProgressForm({...progressForm, technicianSignature: ""})}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Actualizar</Button>
                      </div>
                    </form>
                  </Card>

                  {/* Historial de Cambios */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">Historial de Cambios</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selected.timeline?.map((p, index) => (
                        <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50 relative">
                          <p className="font-medium text-gray-800">{p.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(p.createdAt)} por {p.author || "Sistema"}
                          </p>
                          {p.status && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${statusColors(p.status).bg} ${statusColors(p.status).text}`}>
                              {p.status}
                            </span>
                          )}
                          {p.materialList && p.materialList.length > 0 && (
                            <div className="mt-2 text-xs">
                              <strong>Materiales:</strong> {p.materialList.map(m => `${m.name} (${m.quantity} ${m.unit})`).join(', ')}
                            </div>
                          )}
                          {p.attachmentUrls && p.attachmentUrls.length > 0 && (
                            <div className="mt-2 text-xs">
                              <strong>Adjuntos:</strong> {p.attachmentUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">Ver {i+1}</a>)}
                            </div>
                          )}
                          {p.approvalStatus === 'PENDING' && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button size="xs" variant="success" onClick={() => approveUpdate(index)}>Aprobar</Button>
                              <Button size="xs" variant="danger" onClick={() => rejectUpdate(index)}>Rechazar</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  {/* Detalles del Cliente */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">Información</h3>
                     <Button 
                        size="sm" 
                        className="w-full mb-3"
                        onClick={() => {
                          loadWorkload();
                          setShowAssignModal(true);
                        }}
                      >
                        {selected.technicianName ? `Reasignar (Actual: ${selected.technicianName})` : 'Asignar Técnico'}
                      </Button>
                    <p><strong>Cliente:</strong> {selected.customerName}</p>
                    <p><strong>Email:</strong> {selected.customerEmail}</p>
                    <p><strong>Teléfono:</strong> {selected.customerPhone}</p>
                    <p><strong>Total:</strong> {formatMoney(selected.totalAmount)}</p>
                    <p><strong>Técnico:</strong> {selected.technicianName || 'No asignado'}</p>
                  </Card>

                  {/* Galería de Imágenes */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">Galería de Avances</h3>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-3 block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100"
                    />
                    {imageLoading && <p>Cargando imágenes...</p>}
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.image_url}
                            alt="avance"
                            className="w-full h-auto rounded-md"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs p-1 transition-opacity">
                            <p>Subido por: {img.user?.fullName || img.user?.email}</p>
                            <p>{formatDate(img.uploaded_at)}</p>
                            <div className="flex gap-1 mt-1">
                              <Button size="xs" variant={img.is_approved ? 'secondary' : 'success'} onClick={() => approveImage(Number(img.id))}>
                                {img.is_approved ? 'Aprobada' : 'Aprobar'}
                              </Button>
                              <Button size="xs" variant="danger" onClick={() => rejectImage(Number(img.id))}>Rechazar</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </Modal>
        )}
        
        <AssignmentModal 
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssign}
          technicians={technicians}
        />
      </div>
    </Protected>
  );
}
