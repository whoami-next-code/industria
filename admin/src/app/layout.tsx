import type { Metadata } from "next";
import { IBM_Plex_Sans, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import ModernAdminShell from "@/components/ModernAdminShell";
import RouteGuard from "@/lib/RouteGuard";
import { AdminSocketProvider } from "@/lib/AdminSocketProvider";
import NotificationContainer from "@/components/notifications/NotificationContainer";

const industrialSans = IBM_Plex_Sans({
  variable: "--font-industrial-sans",
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
});

const industrialHeading = Roboto_Condensed({
  variable: "--font-industrial-condensed",
  subsets: ["latin"],
  weight: ["300","400","700"],
});

export const metadata: Metadata = {
  title: "Industrias SP - Admin",
  description: "Panel administrativo Industrias SP",
  icons: {
    icon: "/brand/oculux/images/favicon.ico",
    shortcut: "/brand/oculux/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${industrialSans.variable} ${industrialHeading.variable} antialiased`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:mb-2">Saltar al contenido principal</a>

        <RouteGuard>
          <AdminSocketProvider>
            <NotificationContainer />
            <ModernAdminShell>
              {children}
            </ModernAdminShell>
          </AdminSocketProvider>
        </RouteGuard>
      </body>
    </html>
  );
}
