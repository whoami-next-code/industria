import React from "react";

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & { compact?: boolean };

export default function Table({ compact = false, className, ...props }: TableProps) {
  const base = "w-full text-sm bg-white text-[#111827] ring-1 ring-[#e5e7eb] rounded-md overflow-hidden";
  const cls = className ? `${base} ${className}` : base;
  return <table {...props} className={cls} />;
}

export function Th({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th {...props} className={`text-left px-3 py-2 bg-[#f3f4f6] text-[#111827] font-semibold border-b border-[#e5e7eb] ${className}`}>{children}</th>
  );
}

export function Td({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={`px-3 py-2 border-b border-[#e5e7eb] ${className}`}>{children}</td>
  );
}
