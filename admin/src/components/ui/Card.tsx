import React from "react";

export default function Card({ title, actions, children }: { title?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white text-[#111827] shadow ring-1 ring-[#e5e7eb]">
      {(title || actions) && (
        <header className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold tracking-wide">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">
        {children}
      </div>
    </section>
  );
}
