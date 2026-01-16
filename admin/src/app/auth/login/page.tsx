"use client";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const data = await apiFetch<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email') || ''),
          password: String(form.get('password') || ''),
        })
      });
      localStorage.setItem('token', data.access_token);
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message.trim() ? err.message : 'Credenciales inválidas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="min-h-[calc(100vh-56px)] grid place-items-center px-4 sm:px-6 lg:px-8 py-10 bg-center bg-cover"
      style={{ backgroundImage: "url(/brand/oculux/images/login-img.png)" }}
      aria-label="Sección de inicio de sesión"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg ring-1 ring-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Login Admin</h1>
        <form onSubmit={submit} className="space-y-4" aria-label="Formulario de inicio de sesión">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email@dominio.com"
              required
              className="w-full rounded-md bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-md bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
        </form>
      </div>
    </section>
  );
}

