"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Donation,
  NeedItem,
  getDonations,
  getOrganizations,
  cancelDonation,
  updateDonation,
} from "@/lib/api";
import {
  HeartHandshake,
  TrendingUp,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Trash2,
  Calendar,
  Gift,
  Pencil,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DonorDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const donationIdParam = searchParams.get("donation");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [needsMap, setNeedsMap] = useState<Map<number, NeedItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog / Modal States
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOption, setCancelReasonOption] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);

  // Stepper dismissal state
  const [dismissedPledges, setDismissedPledges] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dismissed_pledges");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const dismissPledge = (id: number) => {
    const updated = [...dismissedPledges, id];
    setDismissedPledges(updated);
    localStorage.setItem("dismissed_pledges", JSON.stringify(updated));
  };

  // Edit Pledge Modal States
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editDonorName, setEditDonorName] = useState("");
  const [editDonorPhone, setEditDonorPhone] = useState("");
  const [editDonorEmail, setEditDonorEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [donationsData, orgsData] = await Promise.all([
        getDonations(),
        getOrganizations(),
      ]);

      setDonations(donationsData);

      // Build Needs Map
      const nMap = new Map<number, NeedItem>();
      orgsData.forEach((org) => {
        org.sections?.forEach((section) => {
          section.needs?.forEach((need) => {
            nMap.set(need.id, {
              ...need,
              section_detail: {
                id: section.id,
                name: section.name,
                organization: org.id,
                organization_name: org.name,
              },
            });
          });
        });
      });
      setNeedsMap(nMap);
    } catch (err) {
      console.error("Failed to load donor dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        fetchData();
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const selectedViewingDonation = (() => {
    if (donationIdParam && donations.length > 0) {
      const donationId = parseInt(donationIdParam, 10);
      const found = donations.find((d) => d.id === donationId);
      if (found) return found;
    }
    return viewingDonation;
  })();

  const handleStartEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setEditQuantity(donation.quantity);
    setEditDeliveryDate(donation.estimated_delivery_date ? donation.estimated_delivery_date.split("T")[0] : "");
    setEditMessage(donation.message || "");
    if (donation.donor_type === "private") {
      setEditDonorName(donation.donor_name || "");
      setEditDonorPhone(donation.donor_phone || "");
      setEditDonorEmail(donation.donor_email || "");
    } else {
      setEditDonorName(donation.government_officer_name || "");
      setEditDonorPhone(donation.government_officer_contact || "");
      setEditDonorEmail(donation.government_email || "");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;
    setIsSavingEdit(true);
    setError("");

    try {
      const updateData: Partial<Donation> = {
        quantity: editQuantity,
        estimated_delivery_date: editDeliveryDate || null,
        message: editMessage,
      };

      if (editingDonation.donor_type === "private") {
        updateData.donor_name = editDonorName;
        updateData.donor_phone = editDonorPhone;
        updateData.donor_email = editDonorEmail;
      } else {
        updateData.government_officer_name = editDonorName;
        updateData.government_officer_contact = editDonorPhone;
        updateData.government_email = editDonorEmail;
      }

      await updateDonation(editingDonation.id, updateData);
      setMessage("Your pledge was updated successfully.");
      setEditingDonation(null);
      await fetchData();
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update pledge.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Compute Metrics
  const totalPledges = donations.length;
  const fulfilledDonations = donations.filter((d) => d.status === "FULFILLED");
  const successfulDeliveries = fulfilledDonations.length;

  // Delivery Success Rate calculation compatible with real world (excluding surplus auto-cancellations)
  const completedPledges = donations.filter(
    (d) =>
      d.status === "FULFILLED" ||
      (d.status === "CANCELLED" &&
        !(d.cancellation_reason || "")
          .toLowerCase()
          .includes("surplus")),
  );

  const deliverySuccessRate =
    completedPledges.length > 0
      ? Math.round((successfulDeliveries / completedPledges.length) * 100)
      : 100; // Default to 100 if no completed pledges

  // Unique organizations supported
  const supportedOrgs = new Set(
    donations
      .map((d) => needsMap.get(d.need_item)?.section_detail?.organization)
      .filter(Boolean),
  );
  const totalOrgsSupported = supportedOrgs.size;

  // Pie Chart Data: Status breakdown
  const statusCounts = donations.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    { PENDING: 0, CONFIRMED: 0, FULFILLED: 0, CANCELLED: 0 } as Record<
      string,
      number
    >,
  );

  const pieChartData = [
    { name: "Pending Verification", value: statusCounts.PENDING, color: "#F59E0B" },
    { name: "Confirmed", value: statusCounts.CONFIRMED, color: "#10B981" },
    { name: "Delivered", value: statusCounts.FULFILLED, color: "#8B5CF6" },
    { name: "Cancelled", value: statusCounts.CANCELLED, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Bar Chart Data: Contributions per Organization
  const orgQtyMap = donations.reduce(
    (acc, d) => {
      const orgName =
        needsMap.get(d.need_item)?.section_detail?.organization_name ||
        "Unknown Organization";
      acc[orgName] = (acc[orgName] || 0) + d.quantity;
      return acc;
    },
    {} as Record<string, number>,
  );

  const barChartData = Object.entries(orgQtyMap)
    .map(([name, value]) => ({ name, fullName: name, value }))
    .slice(0, 5); // Limit to top 5 for neatness

  // Active Pledges (PENDING, CONFIRMED, FULFILLED, or CANCELLED and not dismissed, sorted newest first)
  const activePledges = donations
    .filter(
      (d) =>
        (d.status === "PENDING" ||
          d.status === "CONFIRMED" ||
          d.status === "FULFILLED" ||
          d.status === "CANCELLED") &&
        !dismissedPledges.includes(d.id),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  // Filtered History
  const filteredHistory = donations
    .filter((d) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;

      // 2. Search query matching Need, Org Name, Section, or Date
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const need = needsMap.get(d.need_item);
        const needName = (d.need_item_detail?.name || `Need ${d.need_item}`).toLowerCase();
        const orgName = (need?.section_detail?.organization_name || "").toLowerCase();
        const sectionName = (need?.section_detail?.name || "").toLowerCase();
        const dateStr = new Date(d.created_at).toLocaleDateString().toLowerCase();

        return (
          needName.includes(query) ||
          orgName.includes(query) ||
          sectionName.includes(query) ||
          dateStr.includes(query)
        );
      }

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  // Handle Cancel Pledge Submit
  const handleCancelSubmit = async () => {
    if (cancelTargetId === null) return;
    setIsCancelling(true);
    try {
      await cancelDonation(cancelTargetId, cancelReason);
      setMessage("Your pledge was cancelled successfully.");
      setCancelTargetId(null);
      setCancelReason("");
      setCancelReasonOption("");
      await fetchData();
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel pledge.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Premium Gradient Header Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/10">
                Donor Dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-blue-100 mt-2 text-sm max-w-xl leading-relaxed">
                {`Thank you for your generosity. You have supported ${totalOrgsSupported} organizations. Let's see your real-time impact metrics below.`}
              </p>
            </div>
            <a
              href="/needs"
              className="bg-white text-blue-700 hover:bg-slate-100 transition px-6 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 self-start md:self-auto"
            >
              <HeartHandshake size={18} />
              Explore New Needs
            </a>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {/* Banner Alert messages */}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold">{message}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle size={20} className="text-rose-500 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Pledges */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <HeartHandshake className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Total Pledges
              </p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {totalPledges}
              </p>
            </div>
          </div>

          {/* Card 2: Successful Deliveries */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Delivered
              </p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {successfulDeliveries}
              </p>
            </div>
          </div>

          {/* Card 3: Success Rate */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Success Rate
                </p>
                <div className="relative cursor-help text-slate-400 hover:text-slate-600 group/info flex items-center">
                  <Info size={13} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-20">
                    Calculated as Delivered / Relevant Completed Pledges. System auto-cancellations (due to surplus needs met elsewhere) are excluded so your success rating is not penalized.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {deliverySuccessRate}%
              </p>
            </div>
          </div>

          {/* Card 4: Orgs Supported */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Building className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Organizations Supported
              </p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {totalOrgsSupported}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Analytics Row */}
        {totalPledges > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Status Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between h-[340px]">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Donation Status Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proportion of pending, confirmed, and fulfilled pledges
                </p>
              </div>

              {pieChartData.length > 0 ? (
                <div className="flex items-center justify-between flex-1 mt-4">
                  <div className="w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 pl-6 space-y-2.5">
                    {pieChartData.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">
                            {entry.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                            {entry.value} {entry.value === 1 ? "pledge" : "pledges"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  No chart data available.
                </div>
              )}
            </div>

            {/* Contributions Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between h-[340px]">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Support by Organization
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total item quantities contributed to recipient organizations
                </p>
              </div>

              {barChartData.length > 0 ? (
                <div className="flex-1 mt-6 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} angle={-15} textAnchor="end" height={60} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => [`${value} units`, "Total Contributed"]} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  No organization contribution data.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Deliveries / Stepper Section */}
        {activePledges.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              Active Delivery Stepper
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePledges.map((pledge) => {
                const need = needsMap.get(pledge.need_item);
                const isCancelled = pledge.status === "CANCELLED";
                const cancelledAtStep = isCancelled ? (pledge.confirmed_by_name ? 2 : 1) : 0;
                const step = isCancelled
                  ? 0
                  : pledge.status === "PENDING"
                    ? 1
                    : pledge.status === "CONFIRMED"
                      ? 2
                      : 3;
                return (
                  <div
                    key={pledge.id}
                    className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {pledge.need_item_detail?.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {need?.section_detail?.organization_name} • {need?.section_detail?.name}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {pledge.status === "PENDING" && (
                            <button
                              onClick={() => handleStartEdit(pledge)}
                              className="text-slate-400 hover:text-amber-500 p-1 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Pledge"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {pledge.status === "FULFILLED" ||
                            pledge.status === "CANCELLED" ? (
                            <button
                              onClick={() => dismissPledge(pledge.id)}
                              className="text-slate-450 hover:text-red-650 p-1 hover:bg-red-50 rounded-lg transition"
                              title="Remove Card"
                            >
                              <XCircle size={16} className="text-red-500 hover:text-red-750" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setCancelTargetId(pledge.id)}
                              className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Pledge"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 font-semibold">
                        <span>Quantity: {pledge.quantity} {pledge.need_item_detail?.unit || "units"}</span>
                        {pledge.estimated_delivery_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Est: {new Date(pledge.estimated_delivery_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper progress */}
                    <div className="mt-2">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting Lines */}
                        <div className="absolute left-0 right-0 h-1 bg-slate-100 -z-10 rounded-full" />
                        <div
                          className="absolute left-0 h-1 -z-10 rounded-full transition-all"
                          style={{
                            width: "50%",
                            background: isCancelled
                              ? (cancelledAtStep === 2 ? "#EF4444" : "#F1F5F9")
                              : (step >= 2 ? "#10B981" : "#F1F5F9"),
                          }}
                        />
                        <div
                          className="absolute left-1/2 h-1 -z-10 rounded-full transition-all"
                          style={{
                            width: "50%",
                            background: !isCancelled && step === 3 ? "#8B5CF6" : "#F1F5F9",
                          }}
                        />

                        {/* Step 1: Pledged */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${isCancelled
                              ? (cancelledAtStep === 1
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-amber-500 text-white shadow-md")
                              : "bg-amber-500 text-white shadow-md"
                              }`}
                          >
                            {isCancelled && cancelledAtStep === 1 ? "✕" : "1"}
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-1.5 ${isCancelled
                              ? (cancelledAtStep === 1 ? "text-red-500" : "text-amber-500")
                              : "text-amber-500"
                              }`}
                          >
                            Pledged
                          </span>
                        </div>

                        {/* Step 2: Confirmed by Org */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${isCancelled
                              ? (cancelledAtStep === 2
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-slate-200 text-slate-500")
                              : (step >= 2
                                ? "bg-emerald-500 text-white shadow-md"
                                : "bg-slate-200 text-slate-500")
                              }`}
                          >
                            {isCancelled && cancelledAtStep === 2 ? "✕" : "2"}
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-1.5 ${isCancelled
                              ? (cancelledAtStep === 2 ? "text-red-500" : "text-slate-400")
                              : (step >= 2 ? "text-emerald-500" : "text-slate-400")
                              }`}
                          >
                            Confirmed
                          </span>
                        </div>

                        {/* Step 3: Delivered */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${!isCancelled && step === 3
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-slate-200 text-slate-500"
                              }`}
                          >
                            3
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-1.5 ${!isCancelled && step === 3 ? "text-purple-600" : "text-slate-400"
                              }`}
                          >
                            Delivered
                          </span>
                        </div>
                      </div>
                      <div
                        className={`flex items-start gap-2 mt-3.5 py-2 px-3 rounded-xl border text-[11px] font-medium ${pledge.status === "CANCELLED"
                          ? "bg-rose-50 border-rose-100 text-rose-800"
                          : "bg-slate-50 border-slate-100 text-slate-500"
                          }`}
                      >
                        {step === 1 && (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>Pledge registered. Awaiting verification from hospital.</span>
                          </>
                        )}
                        {step === 2 && (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <span>Verified! Hospital is expecting delivery. Please deliver items.</span>
                          </>
                        )}
                        {step === 3 && (
                          <>
                            <Gift className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span>Fulfilled! Hospital has received your donation. Thank you!</span>
                          </>
                        )}
                        {pledge.status === "CANCELLED" && (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-left w-full">
                              <span className="font-bold text-red-750">
                                This pledge has been cancelled by{" "}
                                {pledge.cancelled_by_role === "DONOR"
                                  ? "you (Donor)"
                                  : pledge.cancelled_by_role === "ORG_ADMIN"
                                    ? "the Recipient Organization"
                                    : pledge.cancelled_by_role === "ADMIN"
                                      ? "the Administrator"
                                      : "an administrator"}
                                .
                              </span>
                              {pledge.cancellation_reason && (
                                <p className="text-[10px] text-red-600 mt-1 font-semibold leading-relaxed">
                                  Reason: &quot;{pledge.cancellation_reason}&quot;
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contribution History Table */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs w-full max-w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Pledges & Donation History
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Search and review all your registered donation contributions
              </p>
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-[450px] w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search need, organization, section, created date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition"
                />
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label
                  htmlFor="status-filter"
                  className="text-sm text-gray-600 font-semibold whitespace-nowrap"
                >
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="FULFILLED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full max-w-full">
              <table className="w-full min-w-[700px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Need Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Section
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Pledged Qty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((donation) => {
                    const need = needsMap.get(donation.need_item);
                    return (
                      <tr key={donation.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${donation.status === "FULFILLED"
                              ? "bg-purple-100 text-purple-800"
                              : donation.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : donation.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                          >
                            {donation.status === "FULFILLED" ? "Delivered" : donation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {donation.need_item_detail?.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {need?.section_detail?.organization_name || "Colombo South Teaching Hospital"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-semibold">
                          {need?.section_detail?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {donation.quantity} {donation.need_item_detail?.unit || "units"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingDonation(donation)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {donation.status === "PENDING" && (
                              <button
                                onClick={() => handleStartEdit(donation)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Pledge"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {(donation.status === "PENDING" || donation.status === "CONFIRMED") && (
                              <button
                                onClick={() => setCancelTargetId(donation.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Cancel Pledge"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No contributions found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or register a new pledge.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Donation Modal */}
      {editingDonation !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[1100] animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Donation Pledge
              </h3>
              <button
                onClick={() => setEditingDonation(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item Details</p>
                <p className="font-bold text-slate-800 text-sm">
                  {editingDonation.need_item_detail?.name}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Recipient: {needsMap.get(editingDonation.need_item)?.section_detail?.organization_name} • {needsMap.get(editingDonation.need_item)?.section_detail?.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                  Quantity ({editingDonation.need_item_detail?.unit || "units"})
                </label>
                <input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                  Message / Notes
                </label>
                <textarea
                  placeholder="Any additional messages or details..."
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 min-h-[80px]"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">
                  Donor Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Name / Officer
                    </label>
                    <input
                      type="text"
                      value={editDonorName}
                      onChange={(e) => setEditDonorName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editDonorPhone}
                      onChange={(e) => setEditDonorPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editDonorEmail}
                    onChange={(e) => setEditDonorEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl text-sm font-bold transition"
                  disabled={isSavingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelTargetId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[1100] animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-up">
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Cancel Donation Pledge?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Are you sure you want to cancel this pledge? Please select a reason below to inform the hospital.
            </p>
            
            <div className="mb-4">
              <label htmlFor="donor-cancel-reason" className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                Cancellation Reason
              </label>
              <select
                id="donor-cancel-reason"
                value={cancelReasonOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setCancelReasonOption(val);
                  if (val !== "Other") {
                    setCancelReason(val);
                  } else {
                    setCancelReason("");
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white text-gray-900 font-medium transition"
                required
              >
                <option value="" disabled>Select a reason...</option>
                <option value="No longer have supply of this item / Out of stock">No longer have supply / Out of stock</option>
                <option value="Unable to transport or deliver the items to the hospital">Unable to transport or deliver the items</option>
                <option value="Made a mistake in the pledge details (quantity, item, etc.)">Made a mistake in the pledge details</option>
                <option value="Accidental submission of the pledge">Accidental submission of the pledge</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {cancelReasonOption === "Other" && (
              <div className="mb-6 animate-fade-in">
                <label htmlFor="donor-cancel-other" className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                  Please specify
                </label>
                <textarea
                  id="donor-cancel-other"
                  placeholder="Please specify your cancellation reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm min-h-[100px] text-slate-800 bg-white"
                  required
                />
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setCancelTargetId(null);
                  setCancelReason("");
                  setCancelReasonOption("");
                }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl text-sm font-bold transition"
                disabled={isCancelling}
              >
                Back
              </button>
              <button
                onClick={handleCancelSubmit}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-sm font-bold transition"
                disabled={isCancelling || !cancelReasonOption || (cancelReasonOption === "Other" && !cancelReason.trim())}
              >
                {isCancelling ? "Cancelling..." : "Cancel Pledge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Donation Details Modal */}
      {selectedViewingDonation !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-10 z-[1100] animate-fade-in w-screen h-screen">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl animate-scale-up my-auto shrink-0 flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 p-4 sm:p-6 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                Pledge Receipt Details
              </h3>
              <button
                onClick={() => {
                  setViewingDonation(null);
                  router.replace("/");
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-sm overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item Pledges</p>
                  <p className="font-bold text-slate-800 text-base mt-1 break-words">
                    {selectedViewingDonation.need_item_detail?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantity</p>
                  <p className="font-bold text-slate-800 text-base mt-1 break-words">
                    {selectedViewingDonation.quantity} {selectedViewingDonation.need_item_detail?.unit || "units"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recipient Organization</p>
                  <p className="font-semibold text-slate-800 mt-0.5 break-words">
                    {needsMap.get(selectedViewingDonation.need_item)?.section_detail?.organization_name || "Colombo South Teaching Hospital"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Section</p>
                  <p className="font-semibold text-slate-800 mt-0.5 break-words">
                    {needsMap.get(selectedViewingDonation.need_item)?.section_detail?.name || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pledge Status</p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${selectedViewingDonation.status === "FULFILLED"
                        ? "bg-purple-100 text-purple-800"
                        : selectedViewingDonation.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedViewingDonation.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {selectedViewingDonation.status === "FULFILLED" ? "Delivered" : selectedViewingDonation.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pledged On</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {new Date(selectedViewingDonation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedViewingDonation.estimated_delivery_date && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Delivery Date</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {new Date(selectedViewingDonation.estimated_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedViewingDonation.message && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Message</p>
                    <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100 break-words">
                      &quot;{selectedViewingDonation.message}&quot;
                    </p>
                  </div>
                )}

                {selectedViewingDonation.confirmed_by_name && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed By</p>
                    <p className="font-semibold text-green-700 mt-0.5 break-words">
                      {selectedViewingDonation.confirmed_by_name}
                      {selectedViewingDonation.confirmed_by_role && ` (${selectedViewingDonation.confirmed_by_role.replace("_", " ")})`}
                    </p>
                  </div>
                )}

                {selectedViewingDonation.received_by_name && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Received By</p>
                    <p className="font-semibold text-purple-700 mt-0.5 break-words">
                      {selectedViewingDonation.received_by_name}
                      {selectedViewingDonation.received_by_role && ` (${selectedViewingDonation.received_by_role.replace("_", " ")})`}
                    </p>
                  </div>
                )}

                {selectedViewingDonation.status === "CANCELLED" && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Cancellation Details</p>
                    <p className="text-slate-700 text-xs mt-1 leading-relaxed break-words">
                      <strong>Cancelled By:</strong>{" "}
                      {selectedViewingDonation.cancelled_by_name || "System/Admin"}
                      {selectedViewingDonation.cancelled_by_role && ` (${selectedViewingDonation.cancelled_by_role.replace("_", " ")})`}
                    </p>
                    {selectedViewingDonation.cancellation_reason && (
                      <p className="text-slate-700 text-xs mt-1 leading-relaxed break-words">
                        <strong>Reason:</strong> {selectedViewingDonation.cancellation_reason}
                      </p>
                    )}
                    {selectedViewingDonation.cancelled_at && (
                      <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                        Cancelled on: {new Date(selectedViewingDonation.cancelled_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end shrink-0 bg-white">
              <button
                onClick={() => setViewingDonation(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
