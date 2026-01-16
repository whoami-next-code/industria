"use client";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";

type ActionCardProps = {
  label: string;
  description?: string;
  href: string;
  icon?: IconName;
};

export default function ActionCard({ label, description, href, icon }: ActionCardProps) {
  return (
    <Link href={href} prefetch className="card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label={label}>
      <div className="card-body">
        <div className="flex items-center gap-3">
          {icon && <Icon variant="fa" name={icon} size={18} />}
          <div className="font-semibold">{label}</div>
        </div>
        {description && <p className="text-muted mt-1 text-sm">{description}</p>}
      </div>
    </Link>
  );
}
