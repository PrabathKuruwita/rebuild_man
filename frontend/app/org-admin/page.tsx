"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  Organization,
  getOrganizations,
  NeedItem,
  getNeeds,
  Donation,
  getDonations,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import AnalyticsView from "@/components/AnalyticsView";
import GraphsView from "@/components/GraphsView";
import OrgLobbyMap from "@/components/OrgLobbyMap";
import {
  Building2,
  Layers,
  ClipboardList,
  AlertTriangle,
  HeartHandshake,
  FileText,
  BarChart3,
  PieChart,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

interface SectionMetric {
  label: string;
  value: number;
  total: number;
  percentage: number;
  status: "success" | "critical" | "warning";
}

interface ChartDataPoint {
  name: string;
  donations: number;
  confirmed: number;
  fulfilled: number;
}

const controlTileStyles = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  emerald:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  indigo:
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
  violet:
    "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
  amber:
    "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
} as const;

type ControlTileColor = keyof typeof controlTileStyles;

export default function OrgAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState({
    sections: 0,
    totalNeeds: 0,
    criticalNeeds: 0,
    donations: 0,
    successfulDonationsThisMonth: 0,
  });
  const [analytics, setAnalytics] = useState({
    fulfillmentRate: 0,
    monthlyGrowth: 0,
    donationRate: 0,
    sectionMetrics: [] as SectionMetric[],
    monthlyData: [] as ChartDataPoint[],
    yearlyData: [] as ChartDataPoint[],
  });
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [orgNeeds, setOrgNeeds] = useState<NeedItem[]>([]);
  const [orgDonations, setOrgDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user?.role !== "ORG_ADMIN") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== "ORG_ADMIN") return;

      try {
        setIsLoading(true);
        setError("");

        const orgs = await getOrganizations();
        if (orgs.length === 0) {
          setIsLoading(false);
          return;
        }

        const myOrg = orgs[0];
        setOrganization(myOrg);

        const allNeeds = await getNeeds();
        const myNeeds = allNeeds.filter(
          (n) => n.section_detail?.organization === myOrg.id,
        );
        const critical = myNeeds
          .filter((n) => n.priority === "CRITICAL")
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime(),
          );

        const unfulfilledCritical = critical.filter(
          (n) => n.quantity_confirmed < n.quantity_required,
        );

        const allDonations = await getDonations();
        const myDonations = allDonations.filter(
          (d) =>
            d.status === "FULFILLED" &&
            d.need_item_detail?.id &&
            myNeeds.some((n) => n.id === d.need_item),
        );

        // Time-based data for Graphs
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Analytics Calculations
        const totalRequired = myNeeds.reduce(
          (sum, n) => sum + n.quantity_required,
          0,
        );
        const totalReceived = myNeeds.reduce(
          (sum, n) => sum + n.quantity_received,
          0,
        );
        const fulfillmentRate =
          totalRequired > 0
            ? Math.round((totalReceived / totalRequired) * 100)
            : 0;

        const thisMonthDonations = myDonations.filter((d) => {
          if (!d.created_at) return false;
          const dDate = new Date(d.created_at);
          return (
            dDate.getMonth() === currentMonth &&
            dDate.getFullYear() === currentYear
          );
        });
        const receivedThisMonth = Math.min(
          totalReceived,
          thisMonthDonations.reduce((sum, d) => sum + d.quantity, 0),
        );
        const receivedLastMonthTotal = totalReceived - receivedThisMonth;
        const lastMonthFulfillmentRate =
          totalRequired > 0
            ? Math.round((receivedLastMonthTotal / totalRequired) * 100)
            : 0;
        const monthlyGrowth = fulfillmentRate - lastMonthFulfillmentRate;

        const orgDonations = allDonations.filter((d) =>
          myNeeds.some((n) => n.id === d.need_item),
        );
        const needsWithAnyDonation = myNeeds.filter((n) =>
          orgDonations.some((d) => d.need_item === n.id),
        ).length;
        const donationRate =
          myNeeds.length > 0
            ? Math.round((needsWithAnyDonation / myNeeds.length) * 100)
            : 0;

        // Section Metrics
        const sectionMetrics: SectionMetric[] = (myOrg.sections || []).map(
          (section): SectionMetric => {
            const sectionNeeds = myNeeds.filter(
              (n) => n.section === section.id,
            );
            const received = sectionNeeds.reduce(
              (sum, n) => sum + n.quantity_received,
              0,
            );
            const required = sectionNeeds.reduce(
              (sum, n) => sum + n.quantity_required,
              0,
            );
            const percentage =
              required > 0 ? Math.round((received / required) * 100) : 0;

            return {
              label: section.name,
              value: received,
              total: required,
              percentage,
              status:
                percentage > 80
                  ? "success"
                  : percentage < 30
                    ? ("critical" as const)
                    : ("warning" as const),
            };
          },
        );

        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentYear, currentMonth - i, 1);
          last6Months.push({
            name: months[d.getMonth()],
            month: d.getMonth(),
            year: d.getFullYear(),
          });
        }

        const monthlyData = last6Months.map((m) => {
          const monthDonations = orgDonations.filter((d) => {
            if (!d.created_at) return false;
            const dDate = new Date(d.created_at);
            return (
              dDate.getMonth() === m.month && dDate.getFullYear() === m.year
            );
          });
          const confirmedMonthDonations = monthDonations.filter(
            (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
          );
          const fulfilledMonthDonations = monthDonations.filter(
            (d) => d.status === "FULFILLED",
          );
          return {
            name: m.name,
            donations: monthDonations.length,
            confirmed: confirmedMonthDonations.length,
            fulfilled: fulfilledMonthDonations.length,
          };
        });

        const last3Years = [currentYear - 2, currentYear - 1, currentYear];
        const yearlyData = last3Years.map((year) => {
          const yearDonations = orgDonations.filter((d) => {
            if (!d.created_at) return false;
            return new Date(d.created_at).getFullYear() === year;
          });
          const confirmedDonations = yearDonations.filter(
            (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
          );
          const fulfilledDonations = yearDonations.filter(
            (d) => d.status === "FULFILLED",
          );
          return {
            name: year.toString(),
            donations: yearDonations.length,
            confirmed: confirmedDonations.length,
            fulfilled: fulfilledDonations.length,
          };
        });

        setStats({
          sections: myOrg.sections?.length || 0,
          totalNeeds: myNeeds.length,
          criticalNeeds: critical.length,
          donations: myDonations.length,
          successfulDonationsThisMonth: thisMonthDonations.length,
        });

        setAnalytics({
          fulfillmentRate,
          monthlyGrowth,
          donationRate,
          sectionMetrics,
          monthlyData,
          yearlyData,
        });

        setCriticalNeeds(unfulfilledCritical.slice(0, 3));
        setOrgNeeds(myNeeds);
        setOrgDonations(orgDonations);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            No Organization Assigned
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Your account is not currently linked to any registered organization.
            To begin managing needs and tracking donations, please register your
            hospital or institution.
          </p>
          <Link
            href="/organizations/new"
            className="inline-block w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            Register Your Organization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                Org Admin
              </span>
              <span className="text-slate-400 text-sm">
                — {organization.name}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Organization Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your organization&apos;s needs and monitor impact
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <FileText size={18} />
              Upload Document
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="SECTIONS"
            value={stats.sections}
            subtitle="Internal sections"
            icon={<Layers size={20} />}
            color="purple"
          />
          <StatsCard
            title="TOTAL NEEDS"
            value={stats.totalNeeds}
            subtitle="Items registered"
            icon={<ClipboardList size={20} />}
            color="green"
          />
          <StatsCard
            title="CRITICAL NEEDS"
            value={stats.criticalNeeds}
            subtitle="Urgent items"
            icon={<AlertTriangle size={20} />}
            color="red"
          />
          <StatsCard
            title="TOTAL DONATIONS"
            value={stats.donations}
            subtitle="Total contributions"
            icon={<HeartHandshake size={20} />}
            color="blue"
          />
        </div>

        {/* Lobby Map */}
        <OrgLobbyMap organization={organization} needs={orgNeeds} donations={orgDonations} />

        {/* Analytics & Graphs */}
        <div id="analytics-section" className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Organization Analytics
              </h2>
              <p className="text-slate-500 text-sm">
                Visualizing donation trends and fulfillment impact
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
              <BarChart3 className="text-blue-600" size={18} />
              <span className="text-sm font-bold text-slate-700">
                Full Report
              </span>
            </div>
          </div>

          <AnalyticsView
            fulfillmentRate={analytics.fulfillmentRate}
            donationRate={analytics.donationRate}
            sectionMetrics={analytics.sectionMetrics}
          />

          <GraphsView
            monthlyData={analytics.monthlyData}
            yearlyData={analytics.yearlyData}
          />
        </div>

        {/* Management Center */}
        <div className="bg-slate-950 rounded-3xl p-10 shadow-2xl relative overflow-hidden mb-12">
          <div className="relative z-10">
            <div className="mb-10">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-blue-300 mb-4">
                Management Center
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Manage your organization
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ControlTile
                label="Manage Needs"
                desc="Update or add needs."
                icon={<ClipboardList size={20} />}
                href="/organizations"
                color="blue"
              />
              <ControlTile
                label="Track Donations"
                desc="See all pledges."
                icon={<HeartHandshake size={20} />}
                href="/admin/donations"
                color="emerald"
              />
              <ControlTile
                label="AI Upload"
                desc="Extract needs from lists."
                icon={<FileText size={20} />}
                href="/documents"
                color="indigo"
              />
              <ControlTile
                label="View Analytics"
                desc="Detailed graphs & trends."
                icon={<PieChart size={20} />}
                href="#analytics-section"
                color="rose"
              />
              <ControlTile
                label="Manage Admins"
                desc="Invite and manage org admins."
                icon={<Users size={20} />}
                href="/org-admin/manage-admins"
                color="violet"
              />
              <ControlTile
                label="Org Profile"
                desc="Update hospital info."
                icon={<Building2 size={20} />}
                href="/organizations/1/edit"
                color="amber"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6">
                Recent Critical Needs
              </h3>
              <div className="space-y-4">
                {criticalNeeds.map((need) => (
                  <div
                    key={need.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{need.name}</p>
                      <p className="text-xs text-slate-500">
                        {need.section_detail?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-600">
                        {need.quantity_required - need.quantity_confirmed} left
                      </p>
                      <progress
                        className="w-24 h-1.5 mt-1 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500 bg-slate-200 text-rose-500"
                        value={need.quantity_confirmed}
                        max={need.quantity_required}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white h-full shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-blue-400">
                Monthly Snapshot
              </h3>
              <div className="space-y-8">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Total Received
                  </p>
                  <p className="text-3xl font-black">
                    {analytics.fulfillmentRate}%
                    <span
                      className={`text-xs font-bold ml-2 ${analytics.monthlyGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {analytics.monthlyGrowth >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(analytics.monthlyGrowth)}%
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Successful Donations
                  </p>
                  <p className="text-3xl font-black">
                    {stats.successfulDonationsThisMonth}{" "}
                    <span className="text-xs text-blue-400 font-bold ml-2">
                      Active
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlTile({
  label,
  desc,
  icon,
  href,
  color,
}: {
  label: string;
  desc: string;
  icon: ReactNode;
  href: string;
  color: ControlTileColor;
}) {
  return (
    <Link
      href={href}
      className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${controlTileStyles[color]}`}
    >
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-bold text-white text-sm mb-2">{label}</h4>
      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
        {desc}
      </p>
    </Link>
  );
}
