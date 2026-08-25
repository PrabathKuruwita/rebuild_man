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
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        const baseReceived = myNeeds.reduce(
          (sum, n) => sum + Math.min(n.quantity_received, n.quantity_required),
          0,
        );
        const totalReceived = myNeeds.reduce(
          (sum, n) => sum + n.quantity_received,
          0,
        );
        const fulfillmentRate =
          totalRequired > 0
            ? Math.min(100, Math.round((baseReceived / totalRequired) * 100))
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
        <div className="page-header-container flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="page-badge">
              <span className="page-badge-dot"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Org Admin
              </span>
              <span className="text-[10px] font-medium text-blue-500/70">
                — {organization.name}
              </span>
            </div>
            <h1 className="page-title">Organization Dashboard</h1>
            <p className="page-subtitle">
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
            title="SUCCESSFUL DONATIONS"
            value={stats.donations}
            subtitle="Total contributions"
            icon={<HeartHandshake size={20} />}
            color="blue"
          />
        </div>

        {/* Lobby Map */}
        <OrgLobbyMap
          organization={organization}
          needs={orgNeeds}
          donations={orgDonations}
        />

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

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="card-container">
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
