"use client";
import React, { useSyncExternalStore } from 'react';
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
import { useInView } from "./animations";

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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

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

// Subtle placeholder skeleton while chart is off-screen to avoid any layout shift
function ChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-4 animate-pulse">
      <div className="space-y-4 w-full">
        <div className="h-px bg-slate-100 w-full" />
        <div className="h-px bg-slate-100 w-full" />
        <div className="h-px bg-slate-100 w-full" />
        <div className="h-px bg-slate-100 w-full" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-3 w-8 bg-slate-100 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
        <div className="h-3 w-8 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

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

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const { ref: monthlyRef, isInView: isMonthlyInView, prefersReducedMotion } = useInView<HTMLDivElement>({
    threshold: 0.15,
    once: true,
  });

  const { ref: yearlyRef, isInView: isYearlyInView } = useInView<HTMLDivElement>({
    threshold: 0.15,
    once: true,
  });

  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ========================================================= */}
        {/* 1. Monthly Donation Trends (Area/Line Chart)              */}
        {/* ========================================================= */}
        <div
          ref={monthlyRef}
          className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 min-w-0 overflow-hidden"
          style={{
            opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
            transform: prefersReducedMotion || isMonthlyInView ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)",
            transition: prefersReducedMotion
              ? "none"
              : "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="mb-6">
            <h3 
              className="font-heading font-bold text-slate-900 text-lg sm:text-xl transition-all duration-500 ease-out"
              style={{
                opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                transform: prefersReducedMotion || isMonthlyInView ? "none" : "translateY(8px)",
                transitionDelay: prefersReducedMotion ? "0ms" : "100ms",
              }}
            >
              Monthly Donation Trends
            </h3>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-start">
                <span 
                  className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide transition-all duration-500 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                    transform: prefersReducedMotion || isMonthlyInView ? "scale(1)" : "scale(0.9)",
                    transitionDelay: prefersReducedMotion ? "0ms" : "180ms",
                  }}
                >
                  Metric: Requests
                </span>
                <span 
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider transition-all duration-500 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                    transform: prefersReducedMotion || isMonthlyInView ? "scale(1)" : "scale(0.9)",
                    transitionDelay: prefersReducedMotion ? "0ms" : "240ms",
                  }}
                >
                  Last 6 Months
                </span>
              </div>

              {/* Custom Legend with Staggered Entrance */}
              <div 
                className="flex flex-wrap items-center gap-2 sm:gap-3.5 bg-slate-50 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-slate-100 transition-all duration-500 ease-out"
                style={{
                  opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                  transform: prefersReducedMotion || isMonthlyInView ? "translateY(0)" : "translateY(8px)",
                  transitionDelay: prefersReducedMotion ? "0ms" : "200ms",
                }}
              >
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "260ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#f59e0b] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Pledges</span>
                </div>
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "320ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10b981] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Confirmed</span>
                </div>
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isMonthlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "380ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#a855f7] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled</span>
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
            ) : isMounted && (isMonthlyInView || prefersReducedMotion) ? (
              /* Progressive Left-to-Right Reveal Container */
              <div
                className="w-full h-full relative"
                style={{
                  clipPath: prefersReducedMotion || isMonthlyInView ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                  transition: prefersReducedMotion
                    ? "none"
                    : "clip-path 1300ms cubic-bezier(0.16, 1, 0.3, 1) 200ms",
                }}
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart
                    key={isMonthlyInView ? "monthly-animated" : "monthly-idle"}
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPledges"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="colorConfirmed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="colorFulfilled"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
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
                    
                    {/* Animated Lines & Soft Area Fills with Staggered Delays */}
                    <Area
                      type="monotone"
                      dataKey="donations"
                      name="Pledges"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPledges)"
                      isAnimationActive={!prefersReducedMotion}
                      animationBegin={150}
                      animationDuration={1300}
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
                      isAnimationActive={!prefersReducedMotion}
                      animationBegin={350}
                      animationDuration={1300}
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
                      isAnimationActive={!prefersReducedMotion}
                      animationBegin={550}
                      animationDuration={1300}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Yearly Fulfillment Analysis (Bar Chart)                */}
        {/* ========================================================= */}
        <div
          ref={yearlyRef}
          className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 min-w-0 overflow-hidden"
          style={{
            opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
            transform: prefersReducedMotion || isYearlyInView ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)",
            transition: prefersReducedMotion
              ? "none"
              : "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms",
          }}
        >
          <div className="mb-6">
            <h3 
              className="font-heading font-bold text-slate-900 text-lg sm:text-xl transition-all duration-500 ease-out"
              style={{
                opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                transform: prefersReducedMotion || isYearlyInView ? "none" : "translateY(8px)",
                transitionDelay: prefersReducedMotion ? "0ms" : "220ms",
              }}
            >
              Yearly Fulfillment Analysis
            </h3>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-start">
                <span 
                  className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-200/60 uppercase tracking-wide transition-all duration-500 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                    transform: prefersReducedMotion || isYearlyInView ? "scale(1)" : "scale(0.9)",
                    transitionDelay: prefersReducedMotion ? "0ms" : "300ms",
                  }}
                >
                  Metric: Requests
                </span>
                <span 
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider transition-all duration-500 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                    transform: prefersReducedMotion || isYearlyInView ? "scale(1)" : "scale(0.9)",
                    transitionDelay: prefersReducedMotion ? "0ms" : "360ms",
                  }}
                >
                  Last 3 Years
                </span>
              </div>

              {/* Custom Legend with Staggered Entrance */}
              <div 
                className="flex flex-wrap items-center gap-2 sm:gap-3.5 bg-slate-50 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-slate-100 transition-all duration-500 ease-out"
                style={{
                  opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                  transform: prefersReducedMotion || isYearlyInView ? "translateY(0)" : "translateY(8px)",
                  transitionDelay: prefersReducedMotion ? "0ms" : "320ms",
                }}
              >
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "380ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#f59e0b] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Pledges</span>
                </div>
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "440ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10b981] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Confirmed</span>
                </div>
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ease-out"
                  style={{
                    opacity: prefersReducedMotion || isYearlyInView ? 1 : 0,
                    transitionDelay: prefersReducedMotion ? "0ms" : "500ms",
                  }}
                >
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#a855f7] inline-block shadow-xs shrink-0" />
                  <span className="font-label text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Fulfilled</span>
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
            ) : isMounted && (isYearlyInView || prefersReducedMotion) ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart
                  key={isYearlyInView ? "yearly-animated" : "yearly-idle"}
                  data={yearlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                  
                  {/* Bars Growing Upward from Baseline with Staggered Begins */}
                  <Bar
                    dataKey="donations"
                    name="Pledges"
                    fill="#f59e0b"
                    radius={[5, 5, 0, 0]}
                    barSize={24}
                    isAnimationActive={!prefersReducedMotion}
                    animationBegin={150}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="confirmed"
                    name="Confirmed"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                    barSize={24}
                    isAnimationActive={!prefersReducedMotion}
                    animationBegin={350}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="fulfilled"
                    name="Fulfilled"
                    fill="#a855f7"
                    radius={[5, 5, 0, 0]}
                    barSize={24}
                    isAnimationActive={!prefersReducedMotion}
                    animationBegin={550}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
