"use client";

import { CheckCircle2, Clock, AlertCircle, TrendingUp, HandHeart, Layers } from "lucide-react";
import StatsCard from "./StatsCard";
import ElevatedCard from "./ElevatedCard";
import AnalyticsLineChart from "./AnalyticsLineChart";
import { AnimatedCounter, AnimatedProgressBar, RevealSection, RevealItem } from "./animations";

interface AnalyticsMetric {
  label: string;
  value: number | string;
  total?: number;
  percentage?: number;
  status?: "critical" | "warning" | "success" | "neutral";
}

interface TrendDataPoint {
  month: string;
  donations: number;
  fulfilled?: number;
}

interface AnalyticsViewProps {
  fulfillmentRate: number;
  donationRate: number;
  sectionMetrics: AnalyticsMetric[];
  trendData?: TrendDataPoint[];
}

export default function AnalyticsView({
  fulfillmentRate,
  donationRate,
  sectionMetrics,
  trendData,
}: AnalyticsViewProps) {
  return (
    <div className="space-y-8">
      {/* High-level Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RevealItem index={0} className="h-full">
          <StatsCard
            label="Overall Received Rate"
            value={`${fulfillmentRate}%`}
            subtext="Percentage of total items required that have been received."
            icon={<TrendingUp size={20} />}
            status="neutral"
          >
            <AnimatedProgressBar
              percentage={fulfillmentRate}
              duration={1000}
              containerClassName="h-2 bg-slate-100 rounded-full overflow-hidden"
              barClassName="h-full bg-status-neutral rounded-full"
            />
          </StatsCard>
        </RevealItem>

        <RevealItem index={1} className="h-full">
          <StatsCard
            label="Donation Engagement Rate"
            value={`${donationRate}%`}
            subtext="Percentage of needs that have at least one donation pledge."
            icon={<HandHeart size={20} />}
            status="success"
          >
            <AnimatedProgressBar
              percentage={donationRate}
              duration={1000}
              containerClassName="h-2 bg-slate-100 rounded-full overflow-hidden"
              barClassName="h-full bg-status-success rounded-full"
            />
          </StatsCard>
        </RevealItem>
      </div>
      
      {/* Main Trend Chart - Visually Dominant */}
      <RevealSection threshold={0.15}>
        <ElevatedCard className="p-4 sm:p-6 lg:p-8" isDominant={true}>
          <AnalyticsLineChart data={trendData} />
        </ElevatedCard>
      </RevealSection>

      {/* Section-wise Analytics */}
      <RevealSection threshold={0.15}>
        <ElevatedCard className="p-4 sm:p-6 lg:p-8">
          <h3 className="font-heading font-bold text-slate-900 mb-6 text-xl">Fulfillment by Section</h3>
          {sectionMetrics.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Layers size={22} />
              </div>
              <h4 className="font-heading font-bold text-slate-800 text-base mb-1">
                No Section Fulfillment Data Available
              </h4>
              <p className="font-body text-xs sm:text-sm text-slate-500 max-w-sm">
                Section fulfillment metrics will appear once needs are registered under specific department sections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectionMetrics.map((metric, idx) => (
                <RevealItem
                  key={idx}
                  index={idx}
                  staggerDelay={0.08}
                  className="h-full"
                >
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-sm h-full flex flex-col justify-between">
                    <div>
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
                          <AnimatedCounter value={metric.value} />
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-label">/ {metric.total} items</span>
                      </div>
                    </div>
                    <AnimatedProgressBar
                      percentage={metric.percentage || 0}
                      duration={800}
                      delay={idx * 60}
                      containerClassName="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden"
                      barClassName={`h-full rounded-full ${
                        metric.status === "success" ? "bg-status-success" : 
                        metric.status === "critical" ? "bg-status-critical" : "bg-status-warning"
                      }`}
                    />
                  </div>
                </RevealItem>
              ))}
            </div>
          )}
        </ElevatedCard>
      </RevealSection>
    </div>
  );
}
