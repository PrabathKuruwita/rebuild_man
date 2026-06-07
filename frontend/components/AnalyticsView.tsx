"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface AnalyticsMetric {
  label: string;
  value: number | string;
  total?: number;
  percentage?: number;
  status?: "critical" | "warning" | "success" | "neutral";
}

interface AnalyticsViewProps {
  fulfillmentRate: number;
  donationRate: number;
  sectionMetrics: AnalyticsMetric[];
}

export default function AnalyticsView({ fulfillmentRate, donationRate, sectionMetrics }: AnalyticsViewProps) {
  return (
    <div className="space-y-8">
      {/* High-level Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Overall Received Rate</h3>
            <span className="text-2xl font-black text-blue-600">{fulfillmentRate}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
              style={{ width: `${fulfillmentRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Percentage of total items required that have been received.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Donation Engagement Rate</h3>
            <span className="text-2xl font-black text-emerald-600">{donationRate}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
              style={{ width: `${donationRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Percentage of needs that have at least one donation pledge.
          </p>
        </div>
      </div>

      {/* Section-wise Analytics */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6">Fulfillment by Section</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionMetrics.map((metric, idx) => (
            <div key={idx} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-bold text-slate-700">{metric.label}</span>
                {metric.status === "success" ? (
                  <CheckCircle2 className="text-emerald-500" size={18} />
                ) : metric.status === "critical" ? (
                  <AlertCircle className="text-rose-500" size={18} />
                ) : (
                  <Clock className="text-amber-500" size={18} />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{metric.value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ {metric.total} items</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    metric.status === "success" ? "bg-emerald-500" : 
                    metric.status === "critical" ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${metric.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
