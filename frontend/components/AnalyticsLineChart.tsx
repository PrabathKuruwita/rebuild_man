"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[170px]">
        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-1.5">
          <p className="font-label text-slate-500 text-xs font-bold uppercase">{label}</p>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/50 uppercase">
            Donations
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
                {typeof item.value === 'number' ? `${item.value.toLocaleString()} ${item.value === 1 ? 'donation' : 'donations'}` : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function AnalyticsLineChart({ 
  data,
  title = "Donation Volume Trends",
  subtitle
}: AnalyticsLineChartProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [isInView, setIsInView] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMounted) return;
    const node = chartContainerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    } else {
      const handleScroll = () => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0) {
          setIsInView(true);
          window.removeEventListener('scroll', handleScroll);
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
        <Activity className="text-slate-300 w-8 h-8" />
      </div>
    );
  }

  const chartData = data || [];
  const hasActivity = chartData.length > 0 && chartData.some((d) => (d.donations || 0) > 0 || (d.fulfilled || 0) > 0);

  if (!hasActivity) {
    return (
      <div ref={chartContainerRef} className="w-full flex flex-col h-full">
        <div className="mb-4 sm:mb-6">
          <h3 className="font-heading font-bold text-slate-900 text-base sm:text-lg md:text-xl truncate">{title}</h3>
          {subtitle && (
            <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md border border-blue-200/60 uppercase tracking-wide">
              Metric: Donations
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
              Last 6 Months
            </span>
          </div>
        </div>
        <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed p-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 sm:mb-4">
            <Activity className="text-slate-400 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base mb-1 text-center">No Donation Activity Yet</h4>
          <p className="font-body text-xs sm:text-sm text-slate-500 text-center">Wait for donations to start charting trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={chartContainerRef} 
      className={`w-full flex flex-col h-full transition-all duration-700 ease-out ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="mb-4 sm:mb-6">
        <h3 className="font-heading font-bold text-slate-900 text-base sm:text-lg md:text-xl truncate">{title}</h3>
        {subtitle && (
          <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md border border-blue-200/60 uppercase tracking-wide">
              Metric: Donations
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
              Last 6 Months
            </span>
          </div>
          
          {/* Custom Legend with Blue & Teal palette */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3.5 bg-slate-50 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-slate-100 w-fit">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#2563eb] inline-block shadow-xs"></span>
              <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Pledged Donations</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#0d9488] inline-block shadow-xs"></span>
              <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled Donations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full h-[260px] sm:h-[320px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
            key={isInView ? "chart-animated" : "chart-static"}
            data={chartData}
            margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
          >
            <defs>
              {/* Electric Blue gradient for Pledged Donations */}
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
              </linearGradient>
              {/* Signature Brand Teal gradient for Fulfilled Donations */}
              <linearGradient id="colorFulfilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.28}/>
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01}/>
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
            
            {/* Fulfilled line in Signature Brand Teal (#0d9488) */}
            <Area 
              type="monotone" 
              dataKey="fulfilled" 
              name="Fulfilled Donations"
              stroke="#0d9488" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFulfilled)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#0d9488' }}
              isAnimationActive={isInView}
              animationBegin={100}
              animationDuration={1800}
              animationEasing="ease-out"
            />
            {/* Pledged line in Vibrant Royal Blue (#2563eb) */}
            <Area 
              type="monotone" 
              dataKey="donations" 
              name="Pledged Donations"
              stroke="#2563eb" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDonations)" 
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: '#2563eb' }}
              isAnimationActive={isInView}
              animationBegin={300}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
