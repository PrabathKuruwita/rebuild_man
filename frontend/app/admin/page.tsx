"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  getOrganizations,
  NeedItem,
  getNeeds,
  getSections,
  getDonations,
  getDonors,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Building2,
  Layers,
  ClipboardList,
  AlertTriangle,
  Search,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState({
    organizations: 0,
    sections: 0,
    totalNeeds: 0,
    criticalNeeds: 0,
    activeNeeds: 0,
    unfulfilledCriticalNeeds: 0,
    activeDonors: 0,
    successfulDeliveriesRate: 0,
  });
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (user?.role === "ADMIN") {
        // Continue rendering admin page
      } else if (user?.role === "ORG_ADMIN") {
        // Redirect to org-admin
        router.push("/org-admin");
      } else {
        // Redirect non-admin users to home
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== "ADMIN") return;

      try {
        setIsLoading(true);
        setError("");

        const [orgs, sections, allNeeds, allDonations, allDonors] =
          await Promise.all([
            getOrganizations(),
            getSections(),
            getNeeds(),
            getDonations(),
            getDonors(),
          ]);

        const critical = allNeeds.filter((n) => n.priority === "CRITICAL");

        const unfulfilledNeeds = allNeeds.filter(
          (n) => n.quantity_received < n.quantity_required,
        );

        const unfulfilledCritical = critical
          .filter((n) => n.quantity_received < n.quantity_required)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );

        // Calculate dynamic delivery rate
        const validDonations = allDonations.filter(
          (d) => d.status !== "CANCELLED",
        );
        const fulfilledDonations = allDonations.filter(
          (d) => d.status === "FULFILLED",
        );
        const deliveryRate =
          validDonations.length > 0
            ? Math.round(
                (fulfilledDonations.length / validDonations.length) * 100,
              )
            : 0;

        setStats({
          organizations: orgs.length,
          sections: sections.length,
          totalNeeds: allNeeds.length,
          criticalNeeds: critical.length,
          activeNeeds: unfulfilledNeeds.length,
          unfulfilledCriticalNeeds: unfulfilledCritical.length,
          activeDonors: allDonors.length,
          successfulDeliveriesRate: deliveryRate,
        });

        setCriticalNeeds(unfulfilledCritical.slice(0, 2)); // Show top 2 critical unfulfilled
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data",
        );
        console.error("Dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Area */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Operational overview and system management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-64 transition-all"
              />
            </div>
            <button
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
              title="Manage Users"
              aria-label="Manage Users"
            >
              <Users size={20} />
            </button>
          </div>
        </div>

        {/* Quick Overview Stats */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Organizations"
              value={stats.organizations}
              subtext="Active organizations"
              icon={<Building2 className="text-blue-600" size={20} />}
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Sections"
              value={stats.sections}
              subtext="Sections tracked"
              icon={<Layers className="text-purple-600" size={20} />}
              iconBg="bg-purple-50"
            />
            <StatCard
              label="Total Needs"
              value={stats.totalNeeds}
              subtext="Items registered"
              icon={<ClipboardList className="text-emerald-600" size={20} />}
              iconBg="bg-emerald-50"
            />
            <StatCard
              label="Critical Needs"
              value={stats.criticalNeeds}
              subtext="Urgent attention required"
              icon={<AlertTriangle className="text-rose-600" size={20} />}
              iconBg="bg-rose-50"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* Critical Needs Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center relative">
                    {stats.unfulfilledCriticalNeeds > 0 && (
                      <AlertTriangle
                        className="text-rose-400 absolute animate-ping opacity-75"
                        size={20}
                      />
                    )}
                    <AlertTriangle
                      className="text-rose-600 relative z-10"
                      size={20}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Critical Needs Requiring Attention
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {stats.unfulfilledCriticalNeeds} urgent items • Immediate
                      assistance needed
                    </p>
                  </div>
                </div>
                <Link
                  href="/needs"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  View All ({stats.activeNeeds}){" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
              <div className="p-6">
                {criticalNeeds.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-slate-400">No critical needs reported</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {criticalNeeds.map((need) => (
                      <CriticalNeedRow key={need.id} need={need} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Info Column - Matches the "Impact Overview" style from your previous version */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden h-full shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">
                  System Status
                </span>
                <h3 className="text-2xl font-bold mb-4">
                  Network Activity Overview
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-8">
                  Monitoring platform transactions, donor engagement, and
                  hospital fulfillment rates across 9 provinces.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Users className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                        Donors Active
                      </p>
                      <p className="text-xl font-bold">{stats.activeDonors}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <ClipboardList className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                        Successful Deliveries
                      </p>
                      <p className="text-xl font-bold">
                        {stats.successfulDeliveriesRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Control Center Tiles */}
        <div className="bg-slate-950 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="mb-10">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-blue-300 mb-4">
                Admin Control Center
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Operational overview for administrators
              </h2>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Monitor the platform, review urgent needs, and jump directly to
                the most important administrative workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ControlTile
                label="Manage Organizations"
                desc="View and delete organizations across the network."
                icon={<Building2 size={20} />}
                href="/organizations"
                color="indigo"
              />
              <ControlTile
                label="Manage Approvals"
                desc="Review and approve or reject organization admin registrations."
                icon={<AlertTriangle size={20} />}
                href="/admin/approvals"
                color="blue"
              />
              <ControlTile
                label="View Donors"
                desc="View registered donors and their involvement."
                icon={<Users size={20} />}
                href="/admin/donors"
                color="violet"
              />
              <ControlTile
                label="Review Critical Needs"
                desc="Focus on urgent items and ensure faster platform response."
                icon={<AlertTriangle size={20} />}
                href="/needs?priority=CRITICAL"
                color="rose"
              />
              <ControlTile
                label="Document Uploads"
                desc="Manage proof of delivery and supporting files."
                icon={<FileText size={20} />}
                href="/documents"
                color="emerald"
              />
              <ControlTile
                label="Impact Analytics"
                desc="Track donation outcomes and platform performance."
                icon={<BarChart3 size={20} />}
                href="/impact"
                color="amber"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  iconBg,
  isWarning,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  isWarning?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        {isWarning && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </div>
      <div>
        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          {label}
        </div>
        <div className="text-3xl font-black text-slate-900 mt-1">{value}</div>
        <div className="text-slate-400 text-[11px] font-medium mt-2">
          {subtext}
        </div>
      </div>
    </div>
  );
}

function CriticalNeedRow({ need }: { need: NeedItem }) {
  const percent = Math.round(
    (need.quantity_received / need.quantity_required) * 100,
  );

  return (
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{need.name}</h4>
          <p className="text-xs text-slate-500 font-medium">
            {need.section_detail?.organization_name}
            {need.section_detail?.name ? ` • ${need.section_detail.name}` : ""}
          </p>
        </div>
        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase tracking-wider border border-rose-200">
          Critical
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Progress
          </span>
          <span className="text-[10px] font-bold text-slate-700">
            {percent}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <style
            dangerouslySetInnerHTML={{
              __html: `.progress-${need.id} { width: ${percent}%; }`,
            }}
          />
          <div
            className={`h-full bg-rose-500 rounded-full transition-all duration-1000 progress-${need.id}`}
          />
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-xs font-medium text-slate-600">
            Received:{" "}
            <span className="text-emerald-600 font-bold">
              {need.quantity_received} Units
            </span>
          </span>
          <span className="text-xs font-medium text-slate-600">
            Needed:{" "}
            <span className="text-rose-600 font-bold">
              {need.quantity_required - need.quantity_received} Units
            </span>
          </span>
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
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    indigo:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
    violet:
      "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
    emerald:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    amber:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
  };

  return (
    <Link
      href={href}
      className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${colorMap[color]}`}
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
