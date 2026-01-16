"use client";
import Image from "next/image";

export type IconName = "dashboard" | "productos" | "cotizaciones" | "pedidos" | "usuarios" | "generic";
type Variant = "svg" | "fa" | "flaticon";

// Wrapper ligero de iconos con soporte para:
// - SVG local (por defecto)
// - Font Awesome clásico (clase "fa") ya importado en el proyecto
// - Flaticon (clase "flaticon-*") si está disponible
export default function Icon({
  name = "generic",
  size = 18,
  className = "",
  variant = "svg",
}: {
  name?: IconName;
  size?: number;
  className?: string;
  variant?: Variant;
}) {
  if (variant === "fa") {
    const faMap: Record<IconName, string> = {
      dashboard: "fa fa-dashboard",
      productos: "fa fa-archive",
      cotizaciones: "fa fa-file-text-o",
      pedidos: "fa fa-shopping-cart",
      usuarios: "fa fa-user",
      generic: "fa fa-circle",
    };
    const cls = faMap[name] ?? faMap.generic;
    return <i className={`${cls} ${className}`} aria-hidden="true" style={{ fontSize: size }} />;
  }

  if (variant === "flaticon") {
    // Convención de clase común en plantillas: "flaticon-<nombre>"
    const cls = `flaticon-${name}`;
    return <i className={`${cls} ${className}`} aria-hidden="true" style={{ fontSize: size }} />;
  }

  // Variante por defecto: SVG local
  const srcMap: Record<IconName, string> = {
    dashboard: "/brand/oculux/images/icon.svg",
    productos: "/brand/oculux/images/icon.svg",
    cotizaciones: "/brand/oculux/images/icon.svg",
    pedidos: "/brand/oculux/images/icon.svg",
    usuarios: "/brand/oculux/images/icon.svg",
    generic: "/brand/oculux/images/icon.svg",
  };
  const src = srcMap[name] ?? srcMap.generic;
  return <Image src={src} alt={name} width={size} height={size} className={className} />;
}
