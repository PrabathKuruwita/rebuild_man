"use client";

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

interface ChartData {
  month: string;
  donations: number;
  fulfilled?: number;
}

interface AnalyticsLineChartProps {
  data?: ChartData[];
  title?: string;
  subtitle?: string;
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

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[170px]">
        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-1.5">
          <p className="font-label text-slate-500 text-xs font-bold uppercase">{label}</p>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/50 uppercase">
            Units
          </span>
        </div>
        {payload.map((entry, index: number) => {
          const item = entry as TooltipEntry;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between mb-1.5 last:mb-0 gap-3">
              <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-heading font-bold text-slate-900 ml-4 whitespace-nowrap">
                {typeof item.value === 'number' ? `${item.value.toLocaleString()} units` : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Fallback mock data if none provided (e.g. public showcase)
const MOCK_DATA: ChartData[] = [
  { month: 'Jan', donations: 120, fulfilled: 80 },
  { month: 'Feb', donations: 250, fulfilled: 150 },
  { month: 'Mar', donations: 380, fulfilled: 290 },
  { month: 'Apr', donations: 310, fulfilled: 240 },
  { month: 'May', donations: 590, fulfilled: 420 },
  { month: 'Jun', donations: 850, fulfilled: 710 },
];

export default function AnalyticsLineChart({ 
  data,
  title = "Donation Volume Trends",
  subtitle = "Monthly breakdown of pledged vs fulfilled donations"
}: AnalyticsLineChartProps) {
  // Use state to delay rendering the chart until mounted to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
        <Activity className="text-slate-300 w-8 h-8" />
      </div>
    );
  }

  const chartData = data ?? MOCK_DATA;
  const hasActivity = data !== undefined
    ? data.length > 0 && data.some((d) => (d.donations || 0) > 0 || (d.fulfilled || 0) > 0)
    : chartData.length > 0 && chartData.some((d) => (d.donations || 0) > 0 || (d.fulfilled || 0) > 0);

  if (!hasActivity) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="mb-6">
          <h3 className="font-heading font-bold text-slate-900 text-lg sm:text-xl whitespace-nowrap">{title}</h3>
          <div className="mt-2.5 flex items-end justify-between gap-4">
            <div className="flex flex-col items-start gap-1.5">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide">
                Metric: Units
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                Last 6 Months
              </span>
            </div>
          </div>
        </div>
        <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Activity className="text-slate-400 w-8 h-8" />
          </div>
          <h4 className="font-heading font-bold text-slate-900 mb-1">No Donation Activity Yet</h4>
          <p className="font-body text-sm text-slate-500">Wait for donations to start charting trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="mb-6">
        <h3 className="font-heading font-bold text-slate-900 text-lg sm:text-xl whitespace-nowrap">{title}</h3>
        <div className="mt-2.5 flex items-end justify-between gap-4">
          <div className="flex flex-col items-start gap-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide">
              Metric: Units
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
              Last 6 Months
            </span>
          </div>
          
          {/* Custom Legend */}
          <div className="flex items-center gap-3.5 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shadow-xs"></span>
              <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Pledged Units</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#a855f7] inline-block shadow-xs"></span>
              <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled Units</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full h-[350px] animate-fade-in-up">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFulfilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Area 
              type="monotone" 
              dataKey="fulfilled" 
              name="Fulfilled"
              stroke="#a855f7" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFulfilled)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#a855f7' }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Area 
              type="monotone" 
              dataKey="donations" 
              name="Pledged"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDonations)" 
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: '#10b981' }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
