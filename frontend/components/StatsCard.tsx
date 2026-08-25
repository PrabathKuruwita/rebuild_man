import React from "react";
import ElevatedCard from "./ElevatedCard";
import AnimatedStat from "./AnimatedStat";

export interface StatsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  status?: "critical" | "warning" | "success" | "neutral";
  isDominant?: boolean;
  children?: React.ReactNode;
}

export default function StatsCard({
  label,
  value,
  subtext,
  icon,
  status = "neutral",
  isDominant = false,
  children,
}: StatsCardProps) {
  // Map status to visual classes
  const statusConfig = {
    critical: {
      bg: "bg-rose-50",
      text: "text-status-critical",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-status-warning",
    },
    success: {
      bg: "bg-emerald-50",
      text: "text-status-success",
    },
    neutral: {
      bg: "bg-slate-50",
      text: "text-status-neutral",
    },
  };

  const config = statusConfig[status];
  
  // Try to parse the value for animation
  let numValue: number | null = null;
  let prefix = "";
  let suffix = "";
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    const match = value.match(/^([^0-9]*)([0-9.,]+)([^0-9]*)$/);
    if (match) {
      prefix = match[1];
      numValue = parseFloat(match[2].replace(/,/g, ''));
      suffix = match[3];
    }
  }

  return (
    <ElevatedCard
      className="p-4 sm:p-5 h-full flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-within:ring-2 focus-within:ring-slate-300"
      isInteractive={true}
      isDominant={isDominant}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 ${config.bg} ${config.text} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
        {status === "critical" && (
          <span className="flex h-3 w-3 relative" title="Critical Status">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-status-critical"></span>
          </span>
        )}
      </div>
      <div className="flex-grow">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest font-label">
          {label}
        </div>
        <div className="text-2xl lg:text-3xl font-heading font-black text-slate-900 mt-0.5">
          {numValue !== null && !isNaN(numValue) ? (
            <AnimatedStat value={numValue} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </div>
        {subtext && (
          <div className="text-slate-400 text-xs font-medium mt-1 mb-1 font-body">
            {subtext}
          </div>
        )}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </ElevatedCard>
  );
}
