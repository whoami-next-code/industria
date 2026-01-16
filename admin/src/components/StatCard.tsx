"use client";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";

type StatCardProps = {
  title: string;
  value: number | string;
  icon?: IconName;
  href?: string;
  accent?: "primary" | "info" | "success" | "warning";
};

export default function StatCard({ title, value, icon, href, accent = "info" }: StatCardProps) {
  const content = (
    <div className="card" aria-label={`${title}: ${value}`}>
      <div className="card-body card-inline">
        {icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full">
            <Icon variant="fa" name={icon} size={18} className="text-brand" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-muted text-sm">{title}</div>
          <div className="text-2xl font-bold" aria-live="polite">{value}</div>
        </div>
        <span className={`badge ${accent}`}>{title}</span>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} prefetch className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {content}
      </Link>
    );
  }
  return content;
}
