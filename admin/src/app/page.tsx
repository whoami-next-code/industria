'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Protected from '@/lib/Protected';
import Card from '@/components/ui/Card';
import Stat from '@/components/ui/Stat';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import DonutChart from '@/components/charts/DonutChart';
import { useAppStore } from '@/store/useAppStore';
import toast from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

type Profile = { email: string; role: string; nombre?: string };
type Stats = { 
  productos: number; 
  cotizaciones: number; 
  pedidos: number;
  usuarios: number;
  clientes: number;
  contactos: number;
  productosActivos: number;
  pedidosPendientes: number;
  cotizacionesAbiertas: number;
};

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: { nombre: string };
};

type Pedido = {
  id: number;
  total: number;
  estado: string;
  fechaCreacion: string;
  cliente?: { nombre: string };
};

type Cotizacion = {
  id: number;
  estado: string;
  total: number;
  fechaCreacion: string;
};

export default function AdminDashboard() {
  const [me, setMe] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useAppStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await apiFetch<Profile>('/auth/profile').catch(() => null);
      const isAdmin = profile?.role === 'ADMIN';
      const isVendedor = profile?.role === 'VENDEDOR';

      const productosPromise = apiFetch<Producto[]>('/productos').catch(() => []);
      const cotizacionesPromise = (isAdmin || isVendedor)
        ? apiFetch<Cotizacion[]>('/cotizaciones').catch(() => [])
        : Promise.resolve<Cotizacion[]>([]);
      const pedidosPromise = apiFetch<Pedido[]>('/pedidos').catch(() => []);
      const contactosPromise = apiFetch<any[]>('/contactos').catch(() => []);
      const usersPromise = isAdmin ? apiFetch<any[]>('/users').catch(() => []) : Promise.resolve<any[]>([]);
      const clientesPromise = isAdmin
        ? apiFetch<any[]>('/users?role=CLIENTE&verified=1').catch(() => [])
        : Promise.resolve<any[]>([]);

      const [prods, cots, peds, contactos, users, clientes] = await Promise.all([
        productosPromise,
        cotizacionesPromise,
        pedidosPromise,
        contactosPromise,
        usersPromise,
        clientesPromise,
      ]);

      setMe(profile);
      setProductos(Array.isArray(prods) ? prods : []);
      setCotizaciones(Array.isArray(cots) ? cots.map(normalizeCotizacion) : []);
      setPedidos(Array.isArray(peds) ? peds.map(normalizePedido) : []);

      const productosActivos = Array.isArray(prods) ? prods.filter((p: Producto) => p.stock > 0).length : 0;
      const pedidosPendientes = Array.isArray(peds) ? peds.filter((p: Pedido) => p.estado !== 'COMPLETADO').length : 0;
      const cotizacionesAbiertas = Array.isArray(cots) ? cots.filter((c: Cotizacion) => c.estado !== 'CERRADA').length : 0;

      setStats({
        productos: Array.isArray(prods) ? prods.length : 0,
        cotizaciones: Array.isArray(cots) ? cots.length : 0,
        pedidos: Array.isArray(peds) ? peds.length : 0,
        usuarios: Array.isArray(users) ? users.length : 0,
        clientes: Array.isArray(clientes) ? clientes.length : 0,
        contactos: Array.isArray(contactos) ? contactos.length : 0,
        productosActivos,
        pedidosPendientes,
        cotizacionesAbiertas,
      });

      addNotification({
        type: 'success',
        title: 'Dashboard actualizado',
        message: 'Los datos se han cargado correctamente',
      });
    } catch (error) {
      toast.error('Error al cargar los datos del dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getLast6MonthsData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }
    
    return last6Months;
  };

  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(String(v ?? 0));
    return Number.isFinite(n) ? n : 0;
  };

  const normalizePedido = (p: any): Pedido => ({
    id: Number(p?.id ?? 0),
    total: num(p?.total),
    estado: String(p?.estado ?? p?.orderStatus ?? 'PENDIENTE'),
    fechaCreacion: String(p?.fechaCreacion ?? p?.createdAt ?? new Date().toISOString()),
    cliente: p?.cliente,
  });

  const normalizeCotizacion = (c: any): Cotizacion => ({
    id: Number(c?.id ?? 0),
    estado: String(c?.estado ?? c?.status ?? 'PENDIENTE'),
    total: num(c?.total ?? 0),
    fechaCreacion: String(c?.fechaCreacion ?? c?.createdAt ?? new Date().toISOString()),
  });

  const getPedidosPorMes = () => {
    const months = getLast6MonthsData();
    const currentDate = new Date();
    const data = months.map((_, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      return pedidos.filter(p => {
        const pedidoDate = new Date(p.fechaCreacion);
        return pedidoDate.getMonth() === monthDate.getMonth() && 
               pedidoDate.getFullYear() === monthDate.getFullYear();
      }).length;
    });
    
    return [{ name: 'Pedidos', data }];
  };

  const getVentasPorMes = () => {
    const months = getLast6MonthsData();
    const currentDate = new Date();
    const data = months.map((_, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      const totalVentas = pedidos
        .filter(p => {
          const pedidoDate = new Date(p.fechaCreacion);
          return pedidoDate.getMonth() === monthDate.getMonth() && 
                 pedidoDate.getFullYear() === monthDate.getFullYear() &&
                 p.estado === 'COMPLETADO';
        })
        .reduce((sum, p) => sum + num(p.total), 0);
      
      return Math.round(totalVentas);
    });
    
    return [{ name: 'Ventas (S/)', data }];
  };

  const getEstadosPedidos = () => {
    const estados = pedidos.reduce((acc: any, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      return acc;
    }, {});
    
    return {
      labels: Object.keys(estados),
      series: Object.values(estados) as number[],
    };
  };

  const getProductosMasVendidos = () => {
    const productCounts = [...productos]
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 5);

    const categories = productCounts.map((p) => {
      const rec = p as unknown as Record<string, unknown>;
      const raw = (rec['nombre'] as string | undefined) ?? (rec['name'] as string | undefined) ?? '';
      const name = typeof raw === 'string' ? raw.trim() : '';
      const safe = name || `#${p.id}`;
      return safe.length > 15 ? safe.substring(0, 15) + '...' : safe;
    });

    return {
      categories,
      data: [{ name: 'Stock', data: productCounts.map(p => Number(p.stock) || 0) }],
    };
  };

  const getUltimosPedidos = () => {
    return [...pedidos]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Protected>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bienvenido, {me?.nombre || me?.email || 'Administrador'}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <i className="fa fa-refresh" />
            Actualizar
          </button>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Productos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.productos ?? 0}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  {stats?.productosActivos ?? 0} activos
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.pedidos ?? 0}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {stats?.pedidosPendientes ?? 0} pendientes
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <ShoppingCartIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cotizaciones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.cotizaciones ?? 0}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  {stats?.cotizacionesAbiertas ?? 0} abiertas
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.clientes ?? 0}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  Total registrados
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart
            title="Tendencia de Pedidos (Últimos 6 meses)"
            data={getPedidosPorMes()}
            categories={getLast6MonthsData()}
            colors={['#3b82f6']}
          />
          
          <BarChart
            title="Ventas Mensuales (S/)"
            data={getVentasPorMes()}
            categories={getLast6MonthsData()}
            colors={['#10b981']}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            title="Estado de Pedidos"
            labels={getEstadosPedidos().labels}
            series={getEstadosPedidos().series}
          />
          
          <BarChart
            title="Top 5 Productos por Stock"
            data={getProductosMasVendidos().data}
            categories={getProductosMasVendidos().categories}
            horizontal={true}
            colors={['#f59e0b']}
          />
        </div>

        {/* Últimos pedidos */}
        <Card title="Últimos Pedidos">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {getUltimosPedidos().map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">#{pedido.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {pedido.cliente?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      S/ {num(pedido.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pedido.estado === 'COMPLETADO' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : pedido.estado === 'ENVIADO'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(pedido.fechaCreacion).toLocaleDateString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Perfil */}
        {me && (
          <Card title="Información del Usuario">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <i className="fa fa-envelope text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{me.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <i className="fa fa-shield text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rol</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{me.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Autenticado</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Protected>
  );
}
