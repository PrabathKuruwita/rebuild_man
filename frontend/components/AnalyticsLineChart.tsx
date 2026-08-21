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
      <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[150px]">
        <p className="font-label text-slate-500 text-xs font-bold uppercase mb-2">{label}</p>
        {payload.map((entry, index: number) => {
          const item = entry as TooltipEntry;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-heading font-bold text-slate-900 ml-4">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Fallback mock data if none provided
const MOCK_DATA: ChartData[] = [
  { month: 'Jan', donations: 120, fulfilled: 80 },
  { month: 'Feb', donations: 250, fulfilled: 150 },
  { month: 'Mar', donations: 380, fulfilled: 290 },
  { month: 'Apr', donations: 310, fulfilled: 240 },
  { month: 'May', donations: 590, fulfilled: 420 },
  { month: 'Jun', donations: 850, fulfilled: 710 },
];

export default function AnalyticsLineChart({ 
  data = MOCK_DATA,
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

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <Activity className="text-slate-400 w-8 h-8" />
        </div>
        <h4 className="font-heading font-bold text-slate-900 mb-1">No Data Available</h4>
        <p className="font-body text-sm text-slate-500">Wait for donations to start charting trends.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-slate-900 text-xl">{title}</h3>
          <p className="font-body text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        
        {/* Custom Legend */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary inline-block shadow-sm"></span>
            <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Pledged</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-sm"></span>
            <span className="font-label text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled</span>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full h-[350px] animate-fade-in-up">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFulfilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
              stroke="#f59e0b" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFulfilled)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Area 
              type="monotone" 
              dataKey="donations" 
              name="Pledged"
              stroke="var(--color-primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDonations)" 
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: 'var(--color-primary)' }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
