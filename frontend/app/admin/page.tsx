"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  getOrganizations,
  NeedItem,
  getNeeds,
  getSections,
  getDonations,
  getDonors,
  Donation,
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
  Activity,
  Map as MapIcon,
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
    provincesCount: 0,
  });
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [monthlyImpact, setMonthlyImpact] = useState<{ label: string; value: number }[]>([]);
  const [districtImpact, setDistrictImpact] = useState<{ district: string; received: number; requested: number }[]>([]);
  const [stories, setStories] = useState<{ title: string; body: string; progress: number }[]>([]);
  const [latestSuccessfulDonations, setLatestSuccessfulDonations] = useState<Donation[]>([]);
  const [impactStats, setImpactStats] = useState({
    totalDonations: 0,
    totalSuccessfulDonations: 0,
    totalReceived: 0,
    totalRequired: 0,
    fulfillmentRate: 0,
    fulfilledNeedsCount: 0,
    totalNeedsCount: 0,
    uniqueDonors: 0,
    totalOrganizations: 0,
    totalRemaining: 0,
    totalOverAllocated: 0,
    baseReceived: 0,
  });
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
          (n) => n.quantity_confirmed < n.quantity_required,
        );

        const unfulfilledCritical = critical
          .filter((n) => n.quantity_confirmed < n.quantity_required)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );

        // Calculate dynamic delivery rate
        const validDonations = allDonations.filter(
          (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
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

        // Calculate dynamic analytical items from impact page
        const successfulDonations = allDonations.filter(
          (d) => d.status === "FULFILLED",
        );

        // 1. Donation Trend (Last 6 Months)
        const monthTotals = new Map<string, number>();
        const monthLabels: string[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i -= 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          monthLabels.push(key);
          monthTotals.set(key, 0);
        }

        for (const donation of successfulDonations) {
          const date = new Date(donation.created_at);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthTotals.has(key)) {
            monthTotals.set(key, (monthTotals.get(key) || 0) + donation.quantity);
          }
        }

        const monthly = monthLabels.map((key) => {
          const [year, month] = key.split("-").map(Number);
          const labelDate = new Date(year, month, 1);
          return {
            label: labelDate.toLocaleString("en", { month: "short" }),
            value: monthTotals.get(key) || 0,
          };
        });
        setMonthlyImpact(monthly);

        // 2. Regional Distribution
        const orgIdToDistrict = new Map<number, string>();
        for (const org of orgs) {
          orgIdToDistrict.set(org.id, org.district || "Unknown");
        }

        const districtMap = new Map<string, { received: number; requested: number }>();
        for (const need of allNeeds) {
          const orgId = need.section_detail?.organization;
          const district = orgId ? orgIdToDistrict.get(orgId) || "Unknown" : "Unknown";
          const current = districtMap.get(district) || { received: 0, requested: 0 };
          districtMap.set(district, {
            received: current.received + need.quantity_received,
            requested: current.requested + need.quantity_required,
          });
        }

        const district = Array.from(districtMap.entries())
          .map(([dName, data]) => ({
            district: dName,
            received: data.received,
            requested: data.requested,
          }))
          .sort((a, b) => b.received - a.received)
          .slice(0, 6);
        setDistrictImpact(district);

        // 3. Impact Stories
        const topNeeds = allNeeds
          .filter((n) => n.quantity_required > 0)
          .map((n) => ({
            name: n.name,
            progress: Math.min(
              100,
              Math.round((n.quantity_received / n.quantity_required) * 100),
            ),
            orgName: n.section_detail?.organization_name || "the community",
          }))
          .sort((a, b) => b.progress - a.progress)
          .slice(0, 3);

        const storiesList = topNeeds.map((item, index) => ({
          title: `Success Story ${index + 1}`,
          body: `${item.name} for ${item.orgName} reached ${item.progress}% coverage through community and institutional donations.`,
          progress: item.progress,
        }));

        if (storiesList.length === 0) {
          storiesList.push({
            title: "Building Momentum",
            body: "The platform is collecting the first wave of support and preparing measurable success stories.",
            progress: 0,
          });
        }
        setStories(storiesList);

        // 4. Recent Successful Donations (Only Fulfilled records)
        const latest = allDonations
          .filter((d) => d.status === "FULFILLED")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setLatestSuccessfulDonations(latest);

        const activeDonorsCount = allDonors.filter(
          (d) => d.donations_count > 0
        ).length;

        const totalRequired = allNeeds.reduce(
          (sum, n) => sum + n.quantity_required,
          0,
        );
        const totalReceived = allNeeds.reduce(
          (sum, n) => sum + n.quantity_received,
          0,
        );
        const totalRemaining = allNeeds.reduce(
          (sum, n) => sum + Math.max(0, n.quantity_required - n.quantity_received),
          0
        );
        const totalOverAllocated = allNeeds.reduce(
          (sum, n) => sum + Math.max(0, n.quantity_received - n.quantity_required),
          0
        );
        const baseReceived = allNeeds.reduce(
          (sum, n) => sum + Math.min(n.quantity_received, n.quantity_required),
          0
        );
        const fulfilledNeedsCount = allNeeds.filter(
          (n) =>
            n.quantity_required > 0 && n.quantity_confirmed >= n.quantity_required,
        ).length;

        setImpactStats({
          totalDonations: allDonations.length,
          totalSuccessfulDonations: successfulDonations.length,
          totalReceived,
          totalRequired,
          fulfillmentRate:
            allNeeds.length > 0
              ? Math.round((fulfilledNeedsCount / allNeeds.length) * 100)
              : 0,
          fulfilledNeedsCount,
          totalNeedsCount: allNeeds.length,
          uniqueDonors: activeDonorsCount,
          totalOrganizations: orgs.length,
          totalRemaining,
          totalOverAllocated,
          baseReceived,
        });

        // Calculate dynamic provinces count based on organization districts
        const districtToProvinceMap: Record<string, string> = {
          colombo: "Western", gampaha: "Western", kalutara: "Western",
          kandy: "Central", matale: "Central", nuwara_eliya: "Central", nuwaraeliya: "Central",
          galle: "Southern", matara: "Southern", hambantota: "Southern",
          jaffna: "Northern", kilinochchi: "Northern", mannar: "Northern", vavuniya: "Northern", mullaitivu: "Northern",
          batticaloa: "Eastern", ampara: "Eastern", trincomalee: "Eastern",
          kurunegala: "North Western", puttalam: "North Western",
          anuradhapura: "North Central", polonnaruwa: "North Central",
          badulla: "Uva", moneragala: "Uva",
          ratnapura: "Sabaragamuwa", kegalle: "Sabaragamuwa"
        };
        const activeProvinces = new Set(
          orgs
            .map((o) => {
              const dNorm = o.district?.trim().toLowerCase().replace(/\s+/g, "_") || "";
              return districtToProvinceMap[dNorm] || o.district?.trim();
            })
            .filter(Boolean)
        );

        setStats({
          organizations: orgs.length,
          sections: sections.length,
          totalNeeds: allNeeds.length,
          criticalNeeds: critical.length,
          activeNeeds: unfulfilledNeeds.length,
          unfulfilledCriticalNeeds: unfulfilledCritical.length,
          activeDonors: allDonors.length,
          successfulDeliveriesRate: deliveryRate,
          provincesCount: activeProvinces.size || 1,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Area */}
      <div className="page-header-container flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="page-badge">
            <span className="page-badge-dot"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              SYS ADMIN
            </span>
            <span className="text-[10px] font-medium text-blue-500/70">
              — NeedTracker Donation Platform
            </span>
          </div>
          <h1 className="page-title">
            Admin Dashboard
          </h1>
          <p className="page-subtitle">
            Operational overview and system management
          </p>
        </div>
      </div>

      {/* Quick Overview Stats */}
      <div className="mb-12">
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
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full">
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
                href="/needs?priority=CRITICAL"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                View All ({stats.unfulfilledCriticalNeeds}){" "}
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

        {/* Side Info Column */}
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
                organization fulfillment rates across 9 provinces.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Users className="text-sky-400" size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Active Donors
                    </p>
                    <p className="text-lg font-bold">{stats.activeDonors}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Activity className="text-amber-400" size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Platform Transactions
                    </p>
                    <p className="text-lg font-bold">{impactStats.totalDonations}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <ClipboardList className="text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Successful Deliveries
                    </p>
                    <p className="text-lg font-bold">
                      {stats.successfulDeliveriesRate}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <MapIcon className="text-indigo-400" size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Provinces Monitored
                    </p>
                    <p className="text-lg font-bold">
                      {stats.provincesCount} {stats.provincesCount === 1 ? "Province" : "Provinces"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Impact Analytics Title & Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Donation Impact Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Track contribution momentum, regional support levels, and delivery outcomes across all organizations
        </p>
      </div>

      {/* Analytical Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
        {/* Total Pledges */}
        <div className="card-container">
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Pledges</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {impactStats.totalDonations.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-semibold text-emerald-705">
            {impactStats.totalSuccessfulDonations.toLocaleString()} confirmed or fulfilled
          </p>
        </div>

        {/* Supplies Delivered */}
        <div className="card-container">
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Supplies Delivered</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {impactStats.totalReceived.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            of {impactStats.totalRequired.toLocaleString()} requested units
          </p>
        </div>

        {/* Needs Fulfillment Rate */}
        <div className="card-container">
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Needs Fulfillment Rate</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {impactStats.fulfillmentRate}%
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {impactStats.fulfilledNeedsCount} of {impactStats.totalNeedsCount} needs covered
          </p>
        </div>

        {/* Active Donors */}
        <div className="card-container">
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Active Donors</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {impactStats.uniqueDonors.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            supporting {impactStats.totalOrganizations.toLocaleString()} organizations
          </p>
        </div>
      </div>

      {/* Donation Trend & Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fade-in">
        {/* Donation Trend (Last 6 Months) */}
        <div className="card-container">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              Donation Trend (Last 6 Months)
            </h3>
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              Units
            </span>
          </div>
          <div className="grid grid-cols-6 items-end gap-3 h-[200px] pt-4">
            {monthlyImpact.map((month) => {
              const maxVal = Math.max(...monthlyImpact.map((m) => m.value), 1);
              const height = Math.max(
                10,
                Math.round((month.value / maxVal) * 140),
              );
              return (
                <div key={month.label} className="flex flex-col items-center">
                  <div className="mb-2 text-[10px] font-bold text-slate-500">
                    {month.value}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500"
                    style={{ height: `${height}px` }}
                  />
                  <div className="mt-2 text-xs font-medium text-slate-600">
                    {month.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="card-container">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              Regional Distribution
            </h3>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Top Districts
            </span>
          </div>

          {districtImpact.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              District-level impact will appear as confirmed donations increase.
            </p>
          ) : (
            <div className="space-y-4">
              {districtImpact.map((item, index) => {
                const width = item.requested > 0
                  ? Math.min(100, Math.round((item.received / item.requested) * 100))
                  : 0;
                return (
                  <div key={item.district}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {item.district}
                      </span>
                      <span className="text-slate-500 text-xs font-medium">
                        {item.received.toLocaleString()}/{item.requested.toLocaleString()} units
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stories & Recent Donations */}
      <div className="grid lg:grid-cols-12 gap-8 mb-12">
        {/* Impact Stories */}
        <div className="lg:col-span-8">
          <div className="card-container h-full">
            <h3 className="font-bold text-slate-900 text-base">Impact Stories</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              A snapshot of needs that received strong donor support
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {stories.map((story, index) => (
                <div
                  key={story.title}
                  className="rounded-xl border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-4"
                >
                  <h4 className="font-semibold text-slate-900 text-sm">{story.title}</h4>
                  <p className="mt-2 min-h-16 text-xs leading-relaxed text-slate-600">
                    {story.body}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${story.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-amber-700">
                    {story.progress}% coverage
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Successful Donations */}
        <div className="lg:col-span-4">
          <div className="card-container h-full">
            <h3 className="font-bold text-slate-900 text-base">
              Recent Successful Donations
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Latest fulfilled contributions
            </p>

            <div className="mt-5 space-y-3">
              {latestSuccessfulDonations.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-xs text-slate-500 text-center">
                  No successful donations yet. Check back once organizations confirm deliveries.
                </p>
              )}

              {latestSuccessfulDonations.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {entry.donor_type === "private"
                          ? entry.donor_name || "Private Donor"
                          : entry.government_department || "Government Donor"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold animate-fade-in">
                      {entry.quantity} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Needs Coverage & Allocation Section */}
      <div className="card-container mb-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Overall Platform Needs Coverage
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Real-time balance between requested items and physically received donations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
              <span className="text-slate-600">Received ({impactStats.baseReceived.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-200 rounded-sm"></span>
              <span className="text-slate-600">Remaining ({impactStats.totalRemaining.toLocaleString()})</span>
            </div>
            {impactStats.totalOverAllocated > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-600">Over Allocated ({impactStats.totalOverAllocated.toLocaleString()})</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-700">
              Current needs coverage is at{" "}
              <span className={impactStats.totalReceived > impactStats.totalRequired ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                {impactStats.totalRequired > 0 ? Math.round((impactStats.totalReceived / impactStats.totalRequired) * 100) : 0}%
              </span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Requested: {impactStats.totalRequired.toLocaleString()} units
            </span>
          </div>

          <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {/* Base Received Segment (emerald-500) */}
            {impactStats.baseReceived > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{
                  width: `${(impactStats.baseReceived / (impactStats.baseReceived + impactStats.totalRemaining + impactStats.totalOverAllocated)) * 100}%`,
                }}
              />
            )}
            {/* Remaining Segment (slate-200) */}
            {impactStats.totalRemaining > 0 && (
              <div
                className="h-full bg-slate-200 transition-all duration-1000"
                style={{
                  width: `${(impactStats.totalRemaining / (impactStats.baseReceived + impactStats.totalRemaining + impactStats.totalOverAllocated)) * 100}%`,
                }}
              />
            )}
            {/* Over Allocated Segment (amber-500) */}
            {impactStats.totalOverAllocated > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{
                  width: `${(impactStats.totalOverAllocated / (impactStats.baseReceived + impactStats.totalRemaining + impactStats.totalOverAllocated)) * 100}%`,
                }}
              />
            )}
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
    <div className="card-container group">
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
    (need.quantity_confirmed / need.quantity_required) * 100,
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
            Confirmed:{" "}
            <span className="text-green-600 font-bold">
              {need.quantity_confirmed} Units
            </span>
            <span className="text-[10px] text-slate-400 ml-1">
              ({need.quantity_received} received)
            </span>
          </span>
          <span className="text-xs font-medium text-slate-600">
            Needed:{" "}
            <span className="text-rose-600 font-bold">
              {Math.max(0, need.quantity_required - need.quantity_confirmed)} Units
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
