import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' };

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-[#111827] border border-[#e5e7eb]",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "bg-transparent hover:bg-[#e6f2ff] text-[#111827]",
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  return (
    <button {...props} className={cls}>{children}</button>
  );
}
