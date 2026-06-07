"use client";

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

interface LegendItem {
  value?: string;
  color?: string;
}

interface LegendContentProps {
  payload?: readonly LegendItem[];
}

interface DonationAnalytics {
  name: string; // Month/Year
  donations: number;
  confirmed: number;
}

interface GraphsViewProps {
  monthlyData: DonationAnalytics[];
  yearlyData: DonationAnalytics[];
}

export default function GraphsView({
  monthlyData,
  yearlyData,
}: GraphsViewProps) {
  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Donation Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">
              Monthly Donation Trends
            </h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
              Last 6 Months
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                />
                <Area
                  type="monotone"
                  dataKey="donations"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDonations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Fulfillment Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">
              Yearly Fulfillment Analysis
            </h3>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded">
              Yearly Growth
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  content={(props) => {
                    const payload = props.payload as
                      | readonly LegendItem[]
                      | undefined;
                    const sortedPayload = payload
                      ? [...payload].sort((a, b) => {
                          if (a.value === "Donations") return -1;
                          if (b.value === "Donations") return 1;
                          return 0;
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
                  }}
                />
                <Bar
                  dataKey="donations"
                  name="Donations"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="confirmed"
                  name="Confirmed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
