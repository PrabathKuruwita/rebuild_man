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
import Link from "next/link";
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
  ChevronUp,
  ChevronDown,
  X,
  User as UserIcon,
  Building2,
  BarChart3,
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  const [message, setMessage] = useState("");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [donorTypeFilter, setDonorTypeFilter] = useState("ALL");

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
  const [editQuantity, setEditQuantity] = useState<number | string>(1);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editDonorName, setEditDonorName] = useState("");
  const [editDonorPhone, setEditDonorPhone] = useState("");
  const [editDonorEmail, setEditDonorEmail] = useState("");
  const [editDonorAddress, setEditDonorAddress] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgProgram, setEditOrgProgram] = useState("");
  const [editOfficerName, setEditOfficerName] = useState("");
  const [editOfficerDesignation, setEditOfficerDesignation] = useState("");
  const [editOfficerPhone, setEditOfficerPhone] = useState("");
  const [editOrgEmail, setEditOrgEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editConfirmAction, setEditConfirmAction] = useState<"save" | "discard" | null>(null);

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

  const isEditOrg = editingDonation ? (editingDonation.donor_type === "organization" || Boolean(editingDonation.organization_name)) : false;
  const currentNeedItem = editingDonation ? (needsMap.get(editingDonation.need_item) || null) : null;
  const currentUnit = currentNeedItem?.unit || editingDonation?.need_item_detail?.unit || "UNIT";
  const realTimeRequired = currentNeedItem ? Math.max(
    1,
    (currentNeedItem.quantity_required - (currentNeedItem.quantity_confirmed || 0)) +
      (editingDonation?.status === "CONFIRMED" ? editingDonation.quantity : 0)
  ) : (editingDonation?.quantity || 1);

  const handleStartEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setEditConfirmAction(null);
    setEditQuantity(donation.quantity);
    setEditDeliveryDate(donation.estimated_delivery_date ? donation.estimated_delivery_date.split("T")[0] : "");
    setEditMessage(donation.message || "");
    
    // Private donor fields
    setEditDonorName(donation.donor_name || "");
    setEditDonorPhone(donation.donor_phone || donation.donor_contact || "");
    setEditDonorEmail(donation.donor_email || "");
    setEditDonorAddress(donation.donor_address || "");

    // Organization donor fields
    setEditOrgName(donation.organization_name || donation.donor_organization || "");
    setEditOrgProgram(donation.organization_program || donation.government_program || "");
    setEditOfficerName(donation.organization_officer_name || donation.government_officer_name || donation.donor_name || "");
    setEditOfficerDesignation(donation.organization_officer_designation || donation.government_officer_designation || "");
    setEditOfficerPhone(donation.organization_officer_contact || donation.government_officer_contact || donation.donor_phone || "");
    setEditOrgEmail(donation.organization_email || donation.government_email || donation.donor_email || "");

    // Fetch real-time updated organizations and needs
    getOrganizations().then((orgsData) => {
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
    }).catch(console.error);
  };

  const initialEditValues = editingDonation ? {
    quantity: editingDonation.quantity,
    deliveryDate: editingDonation.estimated_delivery_date ? editingDonation.estimated_delivery_date.split("T")[0] : "",
    message: editingDonation.message || "",
    donorName: editingDonation.donor_name || "",
    donorPhone: editingDonation.donor_phone || editingDonation.donor_contact || "",
    donorEmail: editingDonation.donor_email || "",
    donorAddress: editingDonation.donor_address || "",
    orgName: editingDonation.organization_name || editingDonation.donor_organization || "",
    orgProgram: editingDonation.organization_program || editingDonation.government_program || "",
    officerName: editingDonation.organization_officer_name || editingDonation.government_officer_name || editingDonation.donor_name || "",
    officerDesignation: editingDonation.organization_officer_designation || editingDonation.government_officer_designation || "",
    officerPhone: editingDonation.organization_officer_contact || editingDonation.government_officer_contact || editingDonation.donor_phone || "",
    orgEmail: editingDonation.organization_email || editingDonation.government_email || editingDonation.donor_email || "",
  } : null;

  const parsedEditQty = typeof editQuantity === "number" ? editQuantity : (parseInt(String(editQuantity), 10) || 0);
  const hasEditChanges = Boolean(
    initialEditValues && (
      parsedEditQty !== initialEditValues.quantity ||
      editDeliveryDate !== initialEditValues.deliveryDate ||
      editMessage !== initialEditValues.message ||
      (isEditOrg ? (
        editOrgName !== initialEditValues.orgName ||
        editOrgProgram !== initialEditValues.orgProgram ||
        editOfficerName !== initialEditValues.officerName ||
        editOfficerDesignation !== initialEditValues.officerDesignation ||
        editOfficerPhone !== initialEditValues.officerPhone ||
        editOrgEmail !== initialEditValues.orgEmail
      ) : (
        editDonorName !== initialEditValues.donorName ||
        editDonorPhone !== initialEditValues.donorPhone ||
        editDonorEmail !== initialEditValues.donorEmail ||
        editDonorAddress !== initialEditValues.donorAddress
      ))
    )
  );

  const handlePromptDiscard = () => {
    if (!hasEditChanges) return;
    setEditConfirmAction("discard");
  };

  const handleConfirmDiscard = () => {
    setEditingDonation(null);
    setEditConfirmAction(null);
  };

  const handlePromptSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditChanges || isSavingEdit) return;
    const numQty = typeof editQuantity === "number" ? editQuantity : parseInt(String(editQuantity), 10);
    if (isNaN(numQty) || numQty < 1) {
      setError("Please enter a valid quantity of 1 or more.");
      return;
    }
    const validatedQty = realTimeRequired ? Math.min(realTimeRequired, numQty) : numQty;
    setEditQuantity(validatedQty);
    if (isEditOrg) {
      if (!editOrgName.trim() || !editOfficerName.trim() || !editOfficerDesignation.trim() || !editOfficerPhone.trim() || !editOrgEmail.trim()) {
        setError("Please fill in all required organization contact fields.");
        return;
      }
    } else {
      if (!editDonorName.trim() || !editDonorPhone.trim() || !editDonorEmail.trim() || !editDonorAddress.trim()) {
        setError("Please fill in all required donor contact fields.");
        return;
      }
    }
    setEditConfirmAction("save");
  };

  const handleConfirmSave = async () => {
    if (!editingDonation) return;
    setIsSavingEdit(true);
    setError("");

    try {
      const numQty = typeof editQuantity === "number" ? editQuantity : parseInt(String(editQuantity), 10) || 1;
      const updateData: Partial<Donation> = {
        quantity: numQty,
        estimated_delivery_date: editDeliveryDate || null,
        message: editMessage,
      };

      if (!isEditOrg) {
        updateData.donor_name = editDonorName;
        updateData.donor_phone = editDonorPhone;
        updateData.donor_email = editDonorEmail;
        updateData.donor_address = editDonorAddress;
      } else {
        updateData.organization_name = editOrgName;
        updateData.organization_program = editOrgProgram;
        updateData.organization_officer_name = editOfficerName;
        updateData.organization_officer_designation = editOfficerDesignation;
        updateData.organization_officer_contact = editOfficerPhone;
        updateData.organization_email = editOrgEmail;
        updateData.government_officer_name = editOfficerName;
        updateData.government_officer_contact = editOfficerPhone;
        updateData.government_email = editOrgEmail;
      }

      await updateDonation(editingDonation.id, updateData);
      setMessage("Your pledge was updated successfully.");
      setEditingDonation(null);
      setEditConfirmAction(null);
      await fetchData();
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update pledge.",
      );
      setEditConfirmAction(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseEditModal = () => {
    if (hasEditChanges) {
      setEditConfirmAction("discard");
    } else {
      setEditingDonation(null);
      setEditConfirmAction(null);
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
    .sort((a, b) => b.value - a.value);

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

      // 2. Donor Type Filter
      const isOrg =
        d.donor_type === "organization" ||
        Boolean(d.organization_name && d.organization_name.trim());
      const type = isOrg ? "organization" : "private";
      if (donorTypeFilter !== "ALL" && type !== donorTypeFilter) return false;

      // 3. Search query matching Need, Org Name, Section, Date, or Donor Type
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const need = needsMap.get(d.need_item);
        const needName = (d.need_item_detail?.name || `Need ${d.need_item}`).toLowerCase();
        const orgName = (need?.section_detail?.organization_name || "").toLowerCase();
        const sectionName = (need?.section_detail?.name || "").toLowerCase();
        const dateStr = new Date(d.created_at).toLocaleDateString().toLowerCase();
        const donorOrgName = (d.organization_name || "").toLowerCase();

        return (
          needName.includes(query) ||
          orgName.includes(query) ||
          sectionName.includes(query) ||
          dateStr.includes(query) ||
          type.includes(query) ||
          donorOrgName.includes(query)
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
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      {/* Premium Gradient Header Card */}
      <div id="donor-header" className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white pt-28 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/10">
                Donor Dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-teal-100 mt-2 text-sm max-w-xl leading-relaxed">
                {`Thank you for your generosity. You have supported ${totalOrgsSupported} organizations. Let's see your real-time impact metrics below.`}
              </p>
            </div>
            <a
              href="/needs"
              className="bg-white text-teal-700 hover:bg-slate-100 transition px-6 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 self-start md:self-auto"
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
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgb(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 group flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <HeartHandshake className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Total Pledges
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                {totalPledges}
              </p>
            </div>
          </div>

          {/* Card 2: Successful Deliveries */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgb(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 group flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <CheckCircle2 className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Delivered
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                {successfulDeliveries}
              </p>
            </div>
          </div>

          {/* Card 3: Success Rate */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgb(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 group flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
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
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                {deliverySuccessRate}%
              </p>
            </div>
          </div>

          {/* Card 4: Orgs Supported */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgb(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 group flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Building className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Organizations Supported
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                {totalOrgsSupported}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Analytics Row */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={20} />
              Donation Analytics
            </h2>
          </div>
          {totalPledges > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[360px] sm:min-h-[340px] h-auto">
                <div className="flex flex-col items-start gap-1.5">
                  <h3 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                    Donation Status Breakdown
                  </h3>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-200/60 tracking-wide">
                    Metric: Requests
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                    All Time
                  </span>
                </div>

                {pieChartData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between flex-1 mt-4 gap-4 sm:gap-6">
                    <div className="w-[160px] sm:w-[180px] h-[160px] sm:h-[180px] shrink-0" style={{ minWidth: 160, minHeight: 160 }}>
                      {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={160} minHeight={160} debounce={50}>
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
                      )}
                    </div>
                    {/* Legend */}
                    <div className="flex-1 pl-0 sm:pl-6 space-y-2 sm:space-y-2.5 w-full sm:w-auto">
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
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mt-4">
                    <p className="text-sm font-semibold text-slate-700">No Chart Data Available</p>
                    <p className="text-xs text-slate-400 mt-1">Status breakdown will display once pledges are recorded.</p>
                  </div>
                )}
              </div>

              {/* Contributions Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between h-[340px]">
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                      Support by Organization
                    </h3>
                    {barChartData.length > 5 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Scroll to view all {barChartData.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-200/60 tracking-wide">
                      Metric: Units
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      By Recipient
                    </span>
                  </div>
                </div>

                {barChartData.length > 0 ? (
                  <div className="flex-1 mt-6 h-[220px] overflow-x-auto overflow-y-hidden pb-1" style={{ minHeight: 220 }}>
                    {isMounted && (
                      <div
                        style={{
                          width: barChartData.length > 5 ? `${Math.max(barChartData.length * 85, 480)}px` : "100%",
                          height: "100%",
                          minWidth: barChartData.length > 5 ? `${Math.max(barChartData.length * 85, 480)}px` : "100%",
                          minHeight: 200,
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200} debounce={50}>
                          <BarChart data={barChartData} margin={{ top: 5, right: 15, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                              dataKey="name"
                              stroke="#94A3B8"
                              fontSize={9}
                              tickLine={false}
                              angle={-20}
                              textAnchor="end"
                              height={55}
                              interval={0}
                              tickFormatter={(val: string) =>
                                val && val.length > 16 ? `${val.slice(0, 14)}…` : val
                              }
                            />
                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                              formatter={(value) => [`${value} units`, "Total Contributed"]}
                              labelFormatter={(label) => label}
                            />
                            <Bar
                              dataKey="value"
                              fill="#3B82F6"
                              radius={[4, 4, 0, 0]}
                              barSize={barChartData.length > 8 ? 22 : 28}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mt-4">
                    <p className="text-sm font-semibold text-slate-700">No Recipient Data Available</p>
                    <p className="text-xs text-slate-400 mt-1">Recipient breakdown will display once pledges are confirmed.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No Donation Analytics Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Your pledge distribution, recipient breakdown, and fulfillment analytics will appear here once you make your first contribution.
              </p>
            </div>
          )}
        </div>

        {/* Active Deliveries / Stepper Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            Active Delivery Stepper
          </h2>
          {activePledges.length > 0 ? (
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
                    onClick={() => setViewingDonation(pledge)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewingDonation(pledge);
                      }
                    }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group relative text-left"
                    title="Click card to view Pledge Receipt Details"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                            {pledge.need_item_detail?.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {need?.section_detail?.organization_name} • {need?.section_detail?.name}
                          </p>
                        </div>
                        <div
                          className="flex gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pledge.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(pledge);
                              }}
                              className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95 cursor-pointer"
                              title="Edit Pledge"
                              aria-label="Edit Pledge"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {pledge.status === "FULFILLED" ||
                            pledge.status === "CANCELLED" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissPledge(pledge.id);
                              }}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95 cursor-pointer"
                              title="Remove Card"
                              aria-label="Remove Card"
                            >
                              <XCircle size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelTargetId(pledge.id);
                              }}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95 cursor-pointer"
                              title="Cancel Pledge"
                              aria-label="Cancel Pledge"
                            >
                              <Trash2 size={15} />
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
                        <div className="absolute left-0 right-0 h-1 bg-slate-100 z-0 rounded-full" />
                        <div
                          className="absolute left-0 h-1 z-0 rounded-full transition-all"
                          style={{
                            width: "50%",
                            background: isCancelled
                              ? (cancelledAtStep === 2 ? "#EF4444" : "#F1F5F9")
                              : (step >= 2 ? "#10B981" : "#F1F5F9"),
                          }}
                        />
                        <div
                          className="absolute left-1/2 h-1 z-0 rounded-full transition-all"
                          style={{
                            width: "50%",
                            background: !isCancelled && step === 3 ? "#8B5CF6" : "#F1F5F9",
                          }}
                        />

                        {/* Step 1: Pledged */}
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm relative z-10 ring-4 ring-white ${isCancelled
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
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm relative z-10 ring-4 ring-white ${isCancelled
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
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm relative z-10 ring-4 ring-white ${!isCancelled && step === 3
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

                      {/* View Receipt Details affordance */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 2xl:text-slate-400 2xl:group-hover:text-blue-600 transition-colors [@media(hover:none)]:text-blue-600">
                        <span className="font-semibold text-blue-600 2xl:text-slate-500 2xl:group-hover:text-blue-600 transition-colors [@media(hover:none)]:text-blue-600">
                          Click card to view receipt details
                        </span>
                        <span className="text-[10px] font-bold group-hover:translate-x-0.5 transition-transform text-blue-600 2xl:text-slate-500 2xl:group-hover:text-blue-600 [@media(hover:none)]:text-blue-600">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No Active Deliveries</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                You have no pending or in-transit delivery pledges at the moment. All previous pledges are completed or you can start a new contribution.
              </p>
              <Link
                href="/needs"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors"
              >
                Browse Needs to Donate
              </Link>
            </div>
          )}
        </div>

        {/* Contribution History Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-xs w-full max-w-full overflow-hidden">
          <div className="border-b border-gray-100 pb-5 sm:pb-6 mb-5 sm:mb-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Pledges & Donation History
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Search and review all your registered donation contributions
              </p>
            </div>

            {/* Filters row placed under the subtitle */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full">
              {/* Search input with full placeholder visibility and clear button */}
              <div className="relative flex-1 min-w-0 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  id="donor-pledge-search"
                  name="search"
                  autoComplete="off"
                  type="text"
                  placeholder="Search need, organization, section, pledged date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400 transition shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                {/* Donor Type Selector */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="donor-type-filter"
                    className="text-sm text-gray-600 font-semibold whitespace-nowrap"
                  >
                    Donor Type:
                  </label>
                  <select
                    id="donor-type-filter"
                    name="donor_type_filter"
                    autoComplete="off"
                    value={donorTypeFilter}
                    onChange={(e) => setDonorTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 font-medium transition cursor-pointer shadow-xs"
                  >
                    <option value="ALL">All Types</option>
                    <option value="private">Private</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="status-filter"
                    className="text-sm text-gray-600 font-semibold whitespace-nowrap"
                  >
                    Status:
                  </label>
                  <select
                    id="status-filter"
                    name="status_filter"
                    autoComplete="off"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 font-medium transition cursor-pointer shadow-xs"
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
          </div>

          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full max-w-full">
              <table className="w-full min-w-[850px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Donor Type
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
                      Pledged Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((donation) => {
                    const need = needsMap.get(donation.need_item);
                    const isOrg =
                      donation.donor_type === "organization" ||
                      Boolean(donation.organization_name && donation.organization_name.trim());
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOrg ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 w-fit">
                                <Building2 size={12} className="shrink-0 text-indigo-600" />
                                Organization
                              </span>
                              {donation.organization_name && (
                                <span className="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[140px]" title={donation.organization_name}>
                                  {donation.organization_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 w-fit">
                              <UserIcon size={12} className="shrink-0 text-blue-600" />
                              Private
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {donation.need_item_detail?.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {need?.section_detail?.organization_name || "Verified Organization"}
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
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewingDonation(donation)}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95"
                              title="View Details"
                              aria-label="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            {donation.status === "PENDING" && (
                              <button
                                onClick={() => handleStartEdit(donation)}
                                className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95"
                                title="Edit Pledge"
                                aria-label="Edit Pledge"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {(donation.status === "PENDING" || donation.status === "CONFIRMED") && (
                              <button
                                onClick={() => setCancelTargetId(donation.id)}
                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition touch-manipulation shadow-xs active:scale-95"
                                title="Cancel Pledge"
                                aria-label="Cancel Pledge"
                              >
                                <Trash2 size={15} />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[1100] animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl animate-scale-up max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
            {editConfirmAction === null ? (
              <>
                {/* Sticky Header Row */}
                <div className="flex justify-between items-center px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-white z-10">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Edit Donation Pledge
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Form wrapping scrollable middle content & sticky footer */}
                <form onSubmit={handlePromptSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
                  {/* Scrollable Middle Content Row */}
                  <div className="overflow-y-auto px-5 sm:px-8 py-4 sm:py-5 space-y-4 flex-1 overscroll-contain">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item Details</p>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">
                            {editingDonation.need_item_detail?.name}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0">
                          {realTimeRequired} {currentUnit} needed
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Recipient: {needsMap.get(editingDonation.need_item)?.section_detail?.organization_name || "Hospital"} • {needsMap.get(editingDonation.need_item)?.section_detail?.name || "OPD"}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="edit-pledge-quantity" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Quantity ({currentUnit}) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative flex-1">
                          <input
                            id="edit-pledge-quantity"
                            name="quantity"
                            autoComplete="off"
                            type="number"
                            min="1"
                            max={realTimeRequired}
                            value={editQuantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                setEditQuantity("");
                                return;
                              }
                              const parsed = parseInt(val, 10);
                              if (!isNaN(parsed)) {
                                if (realTimeRequired && parsed > realTimeRequired) {
                                  setEditQuantity(realTimeRequired);
                                } else {
                                  setEditQuantity(parsed);
                                }
                              }
                            }}
                            onBlur={() => {
                              const num = typeof editQuantity === "number" ? editQuantity : parseInt(String(editQuantity), 10);
                              if (isNaN(num) || num < 1) {
                                setEditQuantity(1);
                              } else if (realTimeRequired && num > realTimeRequired) {
                                setEditQuantity(realTimeRequired);
                              } else {
                                setEditQuantity(num);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-full pl-4 pr-8 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                          />
                          <div className="absolute right-1.5 top-1 bottom-1 flex flex-col justify-center select-none pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = typeof editQuantity === "number" ? editQuantity : parseInt(String(editQuantity), 10) || 0;
                                setEditQuantity(realTimeRequired ? Math.min(realTimeRequired, curr + 1) : curr + 1);
                              }}
                              className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-blue-600 active:text-blue-700 active:scale-90 transition cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <ChevronUp size={13} strokeWidth={2.8} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = typeof editQuantity === "number" ? editQuantity : parseInt(String(editQuantity), 10) || 1;
                                setEditQuantity(Math.max(1, curr - 1));
                              }}
                              className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-blue-600 active:text-blue-700 active:scale-90 transition cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <ChevronDown size={13} strokeWidth={2.8} />
                            </button>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 shrink-0">
                          Required: {realTimeRequired} {currentUnit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="edit-pledge-delivery-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Estimated Delivery Date
                      </label>
                      <input
                        id="edit-pledge-delivery-date"
                        name="delivery_date"
                        autoComplete="off"
                        type="date"
                        value={editDeliveryDate}
                        onChange={(e) => setEditDeliveryDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 font-medium"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-pledge-message" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Message / Notes
                      </label>
                      <textarea
                        id="edit-pledge-message"
                        name="message"
                        autoComplete="off"
                        placeholder="Any additional messages or details..."
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 min-h-[85px] font-medium resize-y"
                      />
                    </div>

                    {/* Donor Information according to donor type */}
                    <div className="border-t border-slate-100 pt-4">
                      {isEditOrg ? (
                        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80 space-y-3">
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                              Organization Information
                            </h4>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                              Organization
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="edit-org-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Organization Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-org-name"
                                name="organization_name"
                                autoComplete="organization"
                                type="text"
                                value={editOrgName}
                                onChange={(e) => setEditOrgName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-org-program" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Program Name
                              </label>
                              <input
                                id="edit-org-program"
                                name="organization_program"
                                autoComplete="off"
                                type="text"
                                value={editOrgProgram}
                                onChange={(e) => setEditOrgProgram(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-officer-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Officer Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-officer-name"
                                name="officer_name"
                                autoComplete="name"
                                type="text"
                                value={editOfficerName}
                                onChange={(e) => setEditOfficerName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-officer-designation" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Officer Designation <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-officer-designation"
                                name="officer_designation"
                                autoComplete="organization-title"
                                type="text"
                                value={editOfficerDesignation}
                                onChange={(e) => setEditOfficerDesignation(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-officer-phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Officer Contact Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-officer-phone"
                                name="officer_phone"
                                autoComplete="tel"
                                type="text"
                                value={editOfficerPhone}
                                onChange={(e) => setEditOfficerPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-org-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Email Address <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-org-email"
                                name="organization_email"
                                autoComplete="email"
                                type="email"
                                value={editOrgEmail}
                                onChange={(e) => setEditOrgEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100/80 space-y-3">
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                              Donor Information
                            </h4>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                              Private Donor
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="edit-donor-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Full Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-donor-name"
                                name="donor_name"
                                autoComplete="name"
                                type="text"
                                value={editDonorName}
                                onChange={(e) => setEditDonorName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-donor-phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Contact Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-donor-phone"
                                name="donor_phone"
                                autoComplete="tel"
                                type="text"
                                value={editDonorPhone}
                                onChange={(e) => setEditDonorPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="edit-donor-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Email Address <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="edit-donor-email"
                                name="donor_email"
                                autoComplete="email"
                                type="email"
                                value={editDonorEmail}
                                onChange={(e) => setEditDonorEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="edit-donor-address" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Address <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                id="edit-donor-address"
                                name="donor_address"
                                autoComplete="street-address"
                                rows={2}
                                value={editDonorAddress}
                                onChange={(e) => setEditDonorAddress(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900 font-medium resize-y"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sticky Bottom Action Row */}
                  <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-t border-slate-100 shrink-0 bg-slate-50/80 sm:bg-white flex gap-3 z-10">
                    <button
                      type="button"
                      onClick={handlePromptDiscard}
                      disabled={!hasEditChanges || isSavingEdit}
                      className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 touch-manipulation ${
                        hasEditChanges && !isSavingEdit
                          ? "bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 border border-slate-200 active:scale-95 cursor-pointer shadow-xs"
                          : "bg-slate-100/60 text-slate-400 border border-transparent cursor-not-allowed opacity-50"
                      }`}
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      disabled={!hasEditChanges || isSavingEdit}
                      className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 touch-manipulation ${
                        hasEditChanges && !isSavingEdit
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95 cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none"
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </>
            ) : editConfirmAction === "discard" ? (
              <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
                {/* Sticky Header */}
                <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-white">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Discard Changes?
                  </h3>
                </div>

                {/* Middle Content */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-xs">
                    <AlertCircle size={30} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Are you sure?
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-4">
                    All unsaved edits made to this pledge will be discarded and reverted back to original values.
                  </p>
                </div>

                {/* Sticky Footer Actions */}
                <div className="px-5 sm:px-8 py-4 border-t border-slate-100 shrink-0 bg-slate-50/80 sm:bg-white flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditConfirmAction(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  >
                    Keep Editing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDiscard}
                    className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Yes, Discard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
                {/* Sticky Header */}
                <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-white">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Confirm Changes
                  </h3>
                </div>

                {/* Middle Content */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xs">
                    <CheckCircle2 size={30} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Save Changes?
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-5">
                    Are you sure you want to update this donation pledge with the new details?
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 text-left w-full max-w-sm space-y-2.5 border border-slate-100 text-xs shadow-xs">
                    {initialEditValues && parsedEditQty !== initialEditValues.quantity && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Updated Quantity:</span>
                        <span className="font-bold text-slate-800 text-right">
                          {editQuantity} {editingDonation.need_item_detail?.unit || "units"}
                        </span>
                      </div>
                    )}
                    {initialEditValues && editDeliveryDate !== initialEditValues.deliveryDate && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Updated Est. Delivery:</span>
                        <span className="font-bold text-slate-800 text-right">
                          {editDeliveryDate ? new Date(editDeliveryDate).toLocaleDateString() : "Not specified"}
                        </span>
                      </div>
                    )}
                    {initialEditValues && editMessage !== initialEditValues.message && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Updated Notes:</span>
                        <span className="font-bold text-slate-800 text-right break-words">
                          {editMessage || "None"}
                        </span>
                      </div>
                    )}
                    {!isEditOrg ? (
                      <>
                        {initialEditValues && editDonorName !== initialEditValues.donorName && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Name:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editDonorName}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editDonorPhone !== initialEditValues.donorPhone && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Contact:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editDonorPhone}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editDonorEmail !== initialEditValues.donorEmail && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Email:</span>
                            <span className="font-bold text-slate-800 text-right break-all">
                              {editDonorEmail}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editDonorAddress !== initialEditValues.donorAddress && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Address:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editDonorAddress}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {initialEditValues && editOrgName !== initialEditValues.orgName && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Org Name:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editOrgName}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editOrgProgram !== initialEditValues.orgProgram && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Program:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editOrgProgram}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editOfficerName !== initialEditValues.officerName && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Officer:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editOfficerName}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editOfficerDesignation !== initialEditValues.officerDesignation && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Designation:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editOfficerDesignation}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editOfficerPhone !== initialEditValues.officerPhone && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Officer Phone:</span>
                            <span className="font-bold text-slate-800 text-right break-words">
                              {editOfficerPhone}
                            </span>
                          </div>
                        )}
                        {initialEditValues && editOrgEmail !== initialEditValues.orgEmail && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 shrink-0">Updated Org Email:</span>
                            <span className="font-bold text-slate-800 text-right break-all">
                              {editOrgEmail}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="px-5 sm:px-8 py-4 border-t border-slate-100 shrink-0 bg-slate-50/80 sm:bg-white flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditConfirmAction(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                    disabled={isSavingEdit}
                  >
                    Review & Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={isSavingEdit}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition shadow-sm active:scale-95 disabled:bg-blue-400 cursor-pointer"
                  >
                    {isSavingEdit ? "Saving..." : "Yes, Save"}
                  </button>
                </div>
              </div>
            )}
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
                name="cancel_reason"
                autoComplete="off"
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
                  name="cancel_other_reason"
                  autoComplete="off"
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
            <div className="flex justify-between items-center border-b border-slate-100 p-4 sm:p-6 shrink-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900">
                Pledge Receipt Details
              </h3>
              <button
                type="button"
                onClick={() => {
                  setViewingDonation(null);
                  router.replace("/");
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer active:scale-95"
                title="Close"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2.5} />
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

                {/* Donor Information based on Donor Type */}
                {selectedViewingDonation.donor_type === "organization" || Boolean(selectedViewingDonation.organization_name) ? (
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                        Organization Information
                      </p>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        Organization
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Organization Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.organization_name || selectedViewingDonation.donor_organization || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Program Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.organization_program || selectedViewingDonation.government_program || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Officer Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.organization_officer_name || selectedViewingDonation.government_officer_name || selectedViewingDonation.donor_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Officer Designation</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.organization_officer_designation || selectedViewingDonation.government_officer_designation || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Officer Contact Number</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.organization_officer_contact || selectedViewingDonation.government_officer_contact || selectedViewingDonation.donor_phone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-all">
                          {selectedViewingDonation.organization_email || selectedViewingDonation.government_email || selectedViewingDonation.donor_email || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100/80 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                        Donor Information
                      </p>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                        Private Donor
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.donor_name || selectedViewingDonation.donor_contact || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.donor_phone || selectedViewingDonation.donor_contact || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-all">
                          {selectedViewingDonation.donor_email || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</p>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {selectedViewingDonation.donor_address || "-"}
                        </p>
                      </div>
                    </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
