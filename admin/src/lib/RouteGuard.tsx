"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * RouteGuard aplica protección global de sesión en el Admin.
 *
 * - No protege las rutas bajo /auth (login, etc.) para evitar bucles.
 * - En el resto de rutas, verifica que exista el token en localStorage.
 *   Si no existe, redirige a /auth/login.
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPath = pathname?.startsWith("/auth");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!isAuthPath && !token) {
      router.replace("/auth/login");
    }
  }, [isAuthPath, token, router]);
  return <>{children}</>;
}
