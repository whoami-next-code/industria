'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Protected from '@/lib/Protected';
import Card from '@/components/ui/Card';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import DonutChart from '@/components/charts/DonutChart';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Producto = {
  id: number;
  nombre: string;
  name?: string;
  precio: number;
  stock: number;
  categoria: { nombre: string; name?: string };
};

type Pedido = {
  id: number;
  total: number;
  estado: string;
  fechaCreacion: string;
  cliente?: { nombre: string; email: string };
  items?: { producto: { nombre: string }; cantidad: number; precioUnitario: number }[];
};

type Cotizacion = {
  id: number;
  estado: string;
  total: number;
  fechaCreacion: string;
  cliente?: { nombre: string };
};

type ReportType = 'ventas' | 'productos' | 'clientes' | 'cotizaciones';

export default function ReportesPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportType>('ventas');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      setLoading(true);
      const [prods, peds, cots] = await Promise.all([
        apiFetch<Producto[]>('/productos').catch(() => []),
        apiFetch<Pedido[]>('/pedidos').catch(() => []),
        apiFetch<Cotizacion[]>('/cotizaciones').catch(() => []),
      ]);

      setProductos(Array.isArray(prods) ? prods : []);
      setPedidos(Array.isArray(peds) ? peds : []);
      setCotizaciones(Array.isArray(cots) ? cots : []);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = <T extends { fechaCreacion: string }>(items: T[]): T[] => {
    return items.filter(item => {
      const itemDate = new Date(item.fechaCreacion);
      return itemDate >= new Date(dateRange.start) && itemDate <= new Date(dateRange.end);
    });
  };

  const exportToPDF = (title: string, data: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Periodo: ${dateRange.start} - ${dateRange.end}`, 14, 32);
    
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(key => item[key]));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
    });
    
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = (title: string, data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title.replace(/ /g, '_')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  const getVentasData = () => {
    const filteredPedidos = filterByDateRange(pedidos.filter(p => p.estado === 'COMPLETADO'));
    
    const ventasPorMes = filteredPedidos.reduce((acc: any, pedido) => {
      const month = new Date(pedido.fechaCreacion).toLocaleDateString('es-PE', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + pedido.total;
      return acc;
    }, {});

    const totalVentas = filteredPedidos.reduce((sum, p) => sum + p.total, 0);
    const promedioVentas = filteredPedidos.length > 0 ? totalVentas / filteredPedidos.length : 0;

    return {
      chart: {
        categories: Object.keys(ventasPorMes),
        data: [{ name: 'Ventas (S/)', data: Object.values(ventasPorMes).map((v: any) => Math.round(v)) }],
      },
      stats: {
        total: totalVentas,
        promedio: promedioVentas,
        cantidad: filteredPedidos.length,
      },
      table: filteredPedidos.map(p => ({
        ID: p.id,
        Cliente: p.cliente?.nombre || 'N/A',
        Total: `S/ ${p.total.toFixed(2)}`,
        Fecha: new Date(p.fechaCreacion).toLocaleDateString('es-PE'),
      })),
    };
  };

  const getProductosData = () => {
    const getNombre = (p: Producto | any) =>
      (typeof p?.nombre === 'string' && p.nombre.trim()) ||
      (typeof p?.name === 'string' && p.name.trim()) ||
      'Producto';
    const getPrecio = (p: Producto | any) => {
      const n = Number(p?.precio);
      return Number.isFinite(n) ? n : 0;
    };
    const getStock = (p: Producto | any) => {
      const n = Number(p?.stock);
      return Number.isFinite(n) ? n : 0;
    };

    const productosPorCategoria = productos.reduce((acc: any, prod) => {
      const categoria = prod.categoria?.nombre || prod?.categoria?.name || 'Sin categoría';
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});

    const productosConBajoStock = productos.filter(p => getStock(p) < 10);
    const valorInventario = productos.reduce((sum, p) => sum + (getPrecio(p) * getStock(p)), 0);

    return {
      donut: {
        labels: Object.keys(productosPorCategoria),
        series: Object.values(productosPorCategoria) as number[],
      },
      bar: {
        categories: productos.slice(0, 10).map(p => getNombre(p).substring(0, 20)),
        data: [{ name: 'Stock', data: productos.slice(0, 10).map(p => getStock(p)) }],
      },
      stats: {
        total: productos.length,
        bajoStock: productosConBajoStock.length,
        valorInventario,
      },
      table: productos.map(p => ({
        ID: p.id,
        Nombre: getNombre(p),
        Categoría: p.categoria?.nombre || (p as any)?.categoria?.name || 'N/A',
        Precio: `S/ ${getPrecio(p).toFixed(2)}`,
        Stock: getStock(p),
        Valor: `S/ ${(getPrecio(p) * getStock(p)).toFixed(2)}`,
      })),
    };
  };

  const getCotizacionesData = () => {
    const filteredCotizaciones = filterByDateRange(cotizaciones);
    
    const cotizacionesPorEstado = filteredCotizaciones.reduce((acc: any, cot) => {
      acc[cot.estado] = (acc[cot.estado] || 0) + 1;
      return acc;
    }, {});

    const tasaConversion = filteredCotizaciones.filter(c => c.estado === 'CERRADA').length / 
                           Math.max(filteredCotizaciones.length, 1) * 100;

    return {
      donut: {
        labels: Object.keys(cotizacionesPorEstado),
        series: Object.values(cotizacionesPorEstado) as number[],
      },
      stats: {
        total: filteredCotizaciones.length,
        abiertas: filteredCotizaciones.filter(c => c.estado !== 'CERRADA').length,
        tasaConversion: tasaConversion.toFixed(1),
      },
      table: filteredCotizaciones.map(c => ({
        ID: c.id,
        Cliente: c.cliente?.nombre || 'N/A',
        Estado: c.estado,
        Total: `S/ ${c.total?.toFixed(2) || '0.00'}`,
        Fecha: new Date(c.fechaCreacion).toLocaleDateString('es-PE'),
      })),
    };
  };

  if (loading) {
    return (
      <Protected>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando reportes...</p>
          </div>
        </div>
      </Protected>
    );
  }

  const ventasData = getVentasData();
  const productosData = getProductosData();
  const cotizacionesData = getCotizacionesData();

  return (
    <Protected>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Analiza el rendimiento de tu negocio</p>
          </div>
        </div>

        {/* Filtros */}
        <Card title="Filtros">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 w-full justify-center"
              >
                <FunnelIcon className="h-5 w-5" />
                Aplicar Filtros
              </button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8">
            {[
              { key: 'ventas', label: 'Ventas' },
              { key: 'productos', label: 'Productos' },
              { key: 'cotizaciones', label: 'Cotizaciones' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ReportType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de Ventas */}
        {activeTab === 'ventas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  S/ {ventasData.stats.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Venta</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  S/ {ventasData.stats.promedio.toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad de Ventas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {ventasData.stats.cantidad}
                </p>
              </div>
            </div>

            <BarChart
              title="Ventas por Mes"
              data={ventasData.chart.data}
              categories={ventasData.chart.categories}
              colors={['#10b981']}
            />

            <Card title="Detalle de Ventas">
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={() => exportToExcel('Reporte_Ventas', ventasData.table)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Excel
                </button>
                <button
                  onClick={() => exportToPDF('Reporte de Ventas', ventasData.table)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {Object.keys(ventasData.table[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {ventasData.table.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {value as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Contenido de Productos */}
        {activeTab === 'productos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {productosData.stats.total}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Bajo Stock</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {productosData.stats.bajoStock}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Inventario</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  S/ {productosData.stats.valorInventario.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DonutChart
                title="Productos por Categoría"
                labels={productosData.donut.labels}
                series={productosData.donut.series}
              />
              
              <BarChart
                title="Stock por Producto (Top 10)"
                data={productosData.bar.data}
                categories={productosData.bar.categories}
                colors={['#3b82f6']}
              />
            </div>

            <Card title="Detalle de Productos">
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={() => exportToExcel('Reporte_Productos', productosData.table)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Excel
                </button>
                <button
                  onClick={() => exportToPDF('Reporte de Productos', productosData.table)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {Object.keys(productosData.table[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productosData.table.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {value as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Contenido de Cotizaciones */}
        {activeTab === 'cotizaciones' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cotizaciones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {cotizacionesData.stats.total}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Cotizaciones Abiertas</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {cotizacionesData.stats.abiertas}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {cotizacionesData.stats.tasaConversion}%
                </p>
              </div>
            </div>

            <DonutChart
              title="Cotizaciones por Estado"
              labels={cotizacionesData.donut.labels}
              series={cotizacionesData.donut.series}
            />

            <Card title="Detalle de Cotizaciones">
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={() => exportToExcel('Reporte_Cotizaciones', cotizacionesData.table)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Excel
                </button>
                <button
                  onClick={() => exportToPDF('Reporte de Cotizaciones', cotizacionesData.table)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {Object.keys(cotizacionesData.table[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cotizacionesData.table.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {value as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Protected>
  );
}
