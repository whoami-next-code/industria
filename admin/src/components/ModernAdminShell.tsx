"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAdminSocket } from "@/lib/AdminSocketProvider";
import { useAppStore } from "@/store/useAppStore";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

// Evitar hidratación inconsistente en HeadlessUI cuando se renderiza en SSR
const NotificationDropdown = dynamic(
  () => import("./notifications/NotificationDropdown"),
  { ssr: false },
);

type NavItem = { href: string; label: string; icon?: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "fa fa-chart-line" },
  { href: "/usuarios", label: "Usuarios", icon: "fa fa-users" },
  { href: "/clientes", label: "Clientes", icon: "fa fa-user-circle" },
  { href: "/productos", label: "Productos", icon: "fa fa-cubes" },
  { href: "/categorias", label: "Categorías", icon: "fa fa-tags" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: "fa fa-file-text" },
  { href: "/pedidos", label: "Pedidos", icon: "fa fa-shopping-cart" },
  { href: "/contactos", label: "Contactos", icon: "fa fa-envelope" },
  { href: "/reportes", label: "Reportes", icon: "fa fa-chart-bar" },
];

export default function ModernAdminShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { darkMode, sidebarCollapsed, toggleDarkMode, toggleSidebar } = useAppStore();

  useEffect(() => {
    const onResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobile && !sidebarCollapsed) toggleSidebar();
  }, [isMobile]);

  useEffect(() => {
    const checkToken = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setLoggedIn(Boolean(token));
    };
    checkToken();
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      if (savedDarkMode !== darkMode) toggleDarkMode();
    }
  }, []);

  return (
    <div className="sp-admin min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={
          `group/sidebar ${!sidebarCollapsed ? 'w-64' : 'w-16'} shrink-0 transition-all duration-200 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`
        }
        aria-label="Menú lateral"
      >
        <div className="h-14 flex items-center gap-2 px-3 border-b border-gray-200 dark:border-gray-700">
          <button
            aria-label={!sidebarCollapsed ? 'Contraer menú' : 'Expandir menú'}
            aria-expanded={!sidebarCollapsed}
            onClick={toggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <i className="fa fa-bars" aria-hidden="true"></i>
          </button>
          <span className={`text-sm font-semibold tracking-wide ${!sidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity`}>Industrias SP</span>
        </div>

        <nav className="py-3" role="navigation" aria-label="Navegación principal">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition`}
                >
                  {item.icon && <i className={`${item.icon}`} aria-hidden="true" />}
                  <span className={`${!sidebarCollapsed ? 'block' : 'sr-only'}`}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" role="banner">
          <div className="flex items-center gap-4">
            {/* Mobile toggle */}
            <button
              aria-label={!sidebarCollapsed ? 'Contraer menú' : 'Expandir menú'}
              aria-expanded={!sidebarCollapsed}
              onClick={toggleSidebar}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i className="fa fa-bars" aria-hidden="true"></i>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Panel de administración</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionIndicator />
            <NotificationDropdown />
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            {loggedIn ? (
              <button
                onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('token'); window.location.href = '/auth/login'; } }}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            ) : (
              <Link href="/auth/login" className="text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Login</Link>
            )}
          </div>
        </header>

        <main id="main" role="main" className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function ConnectionIndicator() {
  const { status } = useAdminSocket();
  const color = status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400';
  const text = status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando' : status === 'error' ? 'Error' : 'Desconectado';
  return <div className={`px-3 py-1 rounded-full text-white text-xs ${color}`}>{text}</div>;
}
