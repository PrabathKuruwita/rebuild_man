"use client";

import { CheckCircle2, Clock, AlertCircle, TrendingUp, HandHeart } from "lucide-react";
import StatsCard from "./StatsCard";
import ElevatedCard from "./ElevatedCard";
import AnalyticsLineChart from "./AnalyticsLineChart";
import AnimatedStat from "./AnimatedStat";

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
        <StatsCard
          label="Overall Received Rate"
          value={`${fulfillmentRate}%`}
          subtext="Percentage of total items required that have been received."
          icon={<TrendingUp size={20} />}
          status="neutral"
        >
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-status-neutral rounded-full transition-all duration-1000" 
              style={{ width: `${fulfillmentRate}%` }}
            />
          </div>
        </StatsCard>

        <StatsCard
          label="Donation Engagement Rate"
          value={`${donationRate}%`}
          subtext="Percentage of needs that have at least one donation pledge."
          icon={<HandHeart size={20} />}
          status="success"
        >
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-status-success rounded-full transition-all duration-1000" 
              style={{ width: `${donationRate}%` }}
            />
          </div>
        </StatsCard>
      </div>
      
      {/* Main Trend Chart - Visually Dominant */}
      <ElevatedCard className="p-8" isDominant={true}>
        <AnalyticsLineChart />
      </ElevatedCard>

      {/* Section-wise Analytics */}
      <ElevatedCard className="p-8">
        <h3 className="font-heading font-bold text-slate-900 mb-6 text-xl">Fulfillment by Section</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionMetrics.map((metric, idx) => (
            <div key={idx} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-bold text-slate-700 font-body">{metric.label}</span>
                {metric.status === "success" ? (
                  <CheckCircle2 className="text-status-success" size={18} />
                ) : metric.status === "critical" ? (
                  <AlertCircle className="text-status-critical" size={18} />
                ) : (
                  <Clock className="text-status-warning" size={18} />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-heading">
                  {typeof metric.value === 'number' ? <AnimatedStat value={metric.value} /> : metric.value}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-label">/ {metric.total} items</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    metric.status === "success" ? "bg-status-success" : 
                    metric.status === "critical" ? "bg-status-critical" : "bg-status-warning"
                  }`}
                  style={{ width: `${metric.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ElevatedCard>
    </div>
  );
}
