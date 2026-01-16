import React from "react";

export default function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-[#e6f2ff] ring-1 ring-[#c8defa] p-4 text-[#111827] flex items-center justify-between">
      <div>
        <div className="text-xs text-[#1e40af]">{label}</div>
        <div className="mt-1 text-2xl font-extrabold">{value}</div>
      </div>
      {icon && (<div className="text-[#3b82f6]">{icon}</div>)}
    </div>
  );
}
