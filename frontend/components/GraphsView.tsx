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
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface LegendItem {
  value?: string;
  color?: string;
}

interface DonationAnalytics {
  name: string; // Month/Year
  donations: number;
  confirmed: number;
  fulfilled: number;
}

interface CustomLegendProps {
  payload?: readonly LegendItem[];
}

const renderCustomLegend = (props: CustomLegendProps) => {
  const payload = props.payload as readonly LegendItem[] | undefined;
  const sortedPayload = payload
    ? [...payload].sort((a, b) => {
        const order = ["Donations", "Confirmed", "Fulfilled"];
        const indexA = order.indexOf(a.value ?? "");
        const indexB = order.indexOf(b.value ?? "");
        return indexA - indexB;
      })
    : [];
  return (
    <ul
      style={{
        display: "flex",
        justifyContent: "flex-end",
        listStyle: "none",
        margin: 0,
        padding: 0,
        gap: "20px",
      }}
    >
      {sortedPayload.map((entry, index) => (
        <li
          key={`item-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <circle
              cx="5"
              cy="5"
              r="5"
              fill={entry.color ?? "#3b82f6"}
            />
          </svg>
          <span
            style={{
              color: entry.color ?? "#3b82f6",
              fontSize: "14px",
            }}
          >
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
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
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Donation Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">
              Monthly Donation Trends
            </h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
              Last 6 Months
            </span>
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
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient
                    id="colorDonations"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorConfirmed"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorFulfilled"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemSorter={(item: { name?: string | number }) => {
                    const order = ["Donations", "Confirmed", "Fulfilled"];
                    return order.indexOf(String(item.name ?? ""));
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  content={renderCustomLegend}
                />
                <Area
                  type="monotone"
                  dataKey="donations"
                  name="Donations"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDonations)"
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">
              Yearly Fulfillment Analysis
            </h3>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded">
              Yearly Growth
            </span>
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
              <BarChart data={yearlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemSorter={(item: { name?: string | number }) => {
                    const order = ["Donations", "Confirmed", "Fulfilled"];
                    return order.indexOf(String(item.name ?? ""));
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  content={renderCustomLegend}
                />
                <Bar
                  dataKey="donations"
                  name="Donations"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="confirmed"
                  name="Confirmed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  animationBegin={200}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="fulfilled"
                  name="Fulfilled"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
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
