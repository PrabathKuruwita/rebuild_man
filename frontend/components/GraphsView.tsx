"use client";
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface DonationAnalytics {
  name: string; // Month/Year
  donations: number;
  confirmed: number;
  fulfilled: number;
}

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// Custom Tooltip with explicit parameter (Requests) and matching design
const GraphTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[170px]">
        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-1.5">
          <p className="font-label text-slate-500 text-xs font-bold uppercase">{label}</p>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/50 uppercase">
            Requests
          </span>
        </div>
        {payload.map((entry, index: number) => {
          return (
            <div key={`item-${index}`} className="flex items-center justify-between mb-1.5 last:mb-0 gap-3">
              <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-heading font-bold text-slate-900 ml-4 whitespace-nowrap">
                {typeof entry.value === 'number' ? `${entry.value.toLocaleString()} requests` : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

interface GraphsViewProps {
  monthlyData: DonationAnalytics[];
  yearlyData: DonationAnalytics[];
}

export default function GraphsView({
  monthlyData,
  yearlyData,
}: GraphsViewProps) {
  const isMonthlyEmpty = monthlyData.every(
    (d) => d.donations === 0 && d.confirmed === 0 && d.fulfilled === 0
  );
  const isYearlyEmpty = yearlyData.every(
    (d) => d.donations === 0 && d.confirmed === 0 && d.fulfilled === 0
  );

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Donation Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5">
          <div className="mb-6">
            <h3 className="font-heading font-bold text-slate-900 text-lg sm:text-xl whitespace-nowrap">
              Monthly Donation Trends
            </h3>
            <div className="mt-2.5 flex items-end justify-between gap-4">
              <div className="flex flex-col items-start gap-1.5">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide">
                  Metric: Requests
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  Last 6 Months
                </span>
              </div>

              {/* Custom Legend */}
              <div className="flex items-center gap-3.5 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Pledges</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#a855f7] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {isMonthlyEmpty ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">No donation activity yet</p>
                <p className="text-xs text-slate-400 text-center mt-1">Data will appear here once donations are recorded.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient
                      id="colorPledges"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorConfirmed"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorFulfilled"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  />
                  <Tooltip content={<GraphTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="donations"
                    name="Pledges"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPledges)"
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    name="Confirmed"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorConfirmed)"
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="fulfilled"
                    name="Fulfilled"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFulfilled)"
                    animationBegin={400}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Yearly Fulfillment Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5">
          <div className="mb-6">
            <h3 className="font-heading font-bold text-slate-900 text-lg sm:text-xl whitespace-nowrap">
              Yearly Fulfillment Analysis
            </h3>
            <div className="mt-2.5 flex items-end justify-between gap-4">
              <div className="flex flex-col items-start gap-1.5">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide">
                  Metric: Requests
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  Last 3 Years
                </span>
              </div>

              {/* Custom Legend */}
              <div className="flex items-center gap-3.5 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Pledges</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#a855f7] inline-block shadow-xs"></span>
                  <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {isYearlyEmpty ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">No donation activity yet</p>
                <p className="text-xs text-slate-400 text-center mt-1">Data will appear here once donations are recorded.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  />
                  <Tooltip content={<GraphTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar
                    dataKey="donations"
                    name="Pledges"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="confirmed"
                    name="Confirmed"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="fulfilled"
                    name="Fulfilled"
                    fill="#a855f7"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    animationBegin={400}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
