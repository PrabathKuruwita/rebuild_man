"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  Donation,
  NeedItem,
  Section,
  getDonations,
  getOrganizations,
  confirmDonation,
  cancelDonation,
  receiveDonation,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CheckCircle2, XCircle, Clock, Gift, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonationDialogState {
  isOpen: boolean;
  type: "confirm" | "cancel" | "receive" | null;
  donationId: number | null;
  donationDetails: Donation | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percentage: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 text-white px-3 py-2 rounded-xl shadow-md border border-slate-800 text-xs">
        <p className="font-semibold text-[11px]">{data.name}</p>
        <p className="mt-1 text-[11px]">
          Value: <span className="font-bold">{data.value.toLocaleString()}</span>
        </p>
        <p className="text-[11px]">
          Share: <span className="font-bold">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

function DonationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const donationIdParam = searchParams.get("donation");
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [receiving, setReceiving] = useState<number | null>(null);
  const [needsMap, setNeedsMap] = useState<Map<number, NeedItem>>(new Map());
  const [sections, setSections] = useState<Section[]>([]);
  const sectionFilter = (() => {
    if (sectionParam) {
      const secId = Number(sectionParam);
      return !isNaN(secId) ? secId : "ALL";
    }
    return "ALL";
  })();
  const [confirmDialog, setConfirmDialog] = useState<DonationDialogState>({
    isOpen: false,
    type: null,
    donationId: null,
    donationDetails: null,
  });
  const [viewDialog, setViewDialog] = useState<Donation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOption, setCancelReasonOption] = useState("");
  const [isReasonStep, setIsReasonStep] = useState(false);
  const [confirmOption, setConfirmOption] = useState<"remaining" | "full">("remaining");
  const [chartSectionFilter, setChartSectionFilter] = useState<string | number>("ALL");
  const [donorTypeFilter, setDonorTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "ORG_ADMIN") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  const fetchDonations = useCallback(async () => {
    if (!user || user.role !== "ORG_ADMIN") return;

    try {
      setError("");

      // Get all donations
      const allDonations = await getDonations();

      // ORG_ADMIN logic
      const orgs = await getOrganizations();
      if (orgs.length > 0) {
        setSections(orgs[0].sections || []);
        const nMap = new Map<number, NeedItem>();
        orgs[0].sections?.forEach((section) => {
          section.needs?.forEach((need) => {
            nMap.set(need.id, need);
          });
        });
        setNeedsMap(nMap);

        const orgNeedIds = new Set<number>();
        orgs[0].sections?.forEach((section) => {
          section.needs?.forEach((need) => {
            orgNeedIds.add(need.id);
          });
        });

        const filteredDonations = allDonations.filter((d) =>
          orgNeedIds.has(d.need_item),
        );

        // Sort donations by most recent completely
        const sortedData = [...filteredDonations].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setDonations(sortedData);
      } else {
        setDonations([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching data:", err);
    }
  }, [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchDonations();
      setIsLoading(false);
    };
    if (user && !authLoading) {
      loadInitialData();
    }
  }, [user, authLoading, fetchDonations, donationIdParam]);

  const handleCloseViewDialog = () => {
    setViewDialog(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("donation");
    const qs = params.toString();
    router.replace(`/admin/donations${qs ? `?${qs}` : ""}`);
  };
  const selectedDonation = (() => {
    if (donationIdParam && donations.length > 0) {
      const donationId = parseInt(donationIdParam, 10);
      const found = donations.find((d) => d.id === donationId);
      if (found) return found;
    }
    return viewDialog;
  })();

  const handleConfirm = async (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    setIsReasonStep(false);
    setConfirmOption("remaining");
    setConfirmDialog({
      isOpen: true,
      type: "confirm",
      donationId,
      donationDetails: donation ?? null,
    });
  };

  const handleConfirmApprove = async () => {
    if (!confirmDialog.donationId || !confirmDialog.donationDetails) return;

    const donation = confirmDialog.donationDetails;
    const need = needsMap.get(donation.need_item);
    const remainingNeeded = need ? Math.max(0, need.quantity_required - need.quantity_confirmed) : 0;

    let confirmedQty = donation.quantity;
    if (donation.quantity > remainingNeeded && confirmOption === "remaining") {
      confirmedQty = remainingNeeded > 0 ? remainingNeeded : donation.quantity;
    }

    setConfirming(confirmDialog.donationId);
    try {
      await confirmDonation(confirmDialog.donationId, confirmedQty);
      setConfirmDialog({
        isOpen: false,
        type: null,
        donationId: null,
        donationDetails: null,
      });
      await fetchDonations();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm donation",
      );
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    setCancelReason("");
    setCancelReasonOption("");
    setIsReasonStep(false);
    setConfirmDialog({
      isOpen: true,
      type: "cancel",
      donationId,
      donationDetails: donation ?? null,
    });
  };

  const handleCancelApprove = async () => {
    if (!confirmDialog.donationId) return;

    setCancelling(confirmDialog.donationId);
    try {
      await cancelDonation(confirmDialog.donationId, cancelReason);
      setConfirmDialog({
        isOpen: false,
        type: null,
        donationId: null,
        donationDetails: null,
      });
      setCancelReason("");
      setCancelReasonOption("");
      setIsReasonStep(false);
      await fetchDonations();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel donation",
      );
    } finally {
      setCancelling(null);
    }
  };

  const handleReceive = async (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    setConfirmDialog({
      isOpen: true,
      type: "receive",
      donationId,
      donationDetails: donation ?? null,
    });
  };

  const handleReceiveApprove = async () => {
    if (!confirmDialog.donationId) return;

    setReceiving(confirmDialog.donationId);
    try {
      await receiveDonation(confirmDialog.donationId);
      setConfirmDialog({
        isOpen: false,
        type: null,
        donationId: null,
        donationDetails: null,
      });
      await fetchDonations();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to mark donation as received",
      );
    } finally {
      setReceiving(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="text-green-600" size={20} />;
      case "CANCELLED":
        return <XCircle className="text-red-600" size={20} />;
      case "FULFILLED":
        return <Gift className="text-purple-600" size={20} />;
      default:
        return <Clock className="text-yellow-600" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "FULFILLED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Group fulfilled donations by need item
  const groupDonationsByNeedItem = (
    donations: Donation[],
  ): Record<number, Donation[]> => {
    return donations.reduce(
      (groups, donation) => {
        const needId = donation.need_item;
        if (!groups[needId]) {
          groups[needId] = [];
        }
        groups[needId].push(donation);
        return groups;
      },
      {} as Record<number, Donation[]>,
    );
  };


  const sectionFilteredDonations = (() => {
    if (sectionFilter === "ALL") return donations;
    return donations.filter((d) => {
      const need = needsMap.get(d.need_item);
      return need?.section === sectionFilter;
    });
  })();

  const searchAndTypeFilteredDonations = (() => {
    let result = sectionFilteredDonations;

    // Apply Donor Type filter
    if (donorTypeFilter !== "ALL") {
      result = result.filter((d) => d.donor_type === donorTypeFilter);
    }

    // Apply Search Query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        // 1. Need Item
        const needItemName = (d.need_item_detail?.name || `Need ${d.need_item}`).toLowerCase();

        // 2. Created Date (need item's created_at)
        const needObj = needsMap.get(d.need_item);
        const createdDateStr = needObj?.created_at
          ? new Date(needObj.created_at).toLocaleDateString().toLowerCase()
          : "";

        // 3. Donor Info (Name, Email)
        const donorName = (d.donor_type === "private" ? d.donor_name : d.government_department || "").toLowerCase();
        const donorEmail = (d.donor_type === "private" ? d.donor_email : d.government_email || "").toLowerCase();

        // 4. Requested Date (donation created_at)
        const requestedDateStr = d.created_at
          ? new Date(d.created_at).toLocaleDateString().toLowerCase()
          : "";

        return (
          needItemName.includes(query) ||
          createdDateStr.includes(query) ||
          donorName.includes(query) ||
          donorEmail.includes(query) ||
          requestedDateStr.includes(query)
        );
      });
    }

    return result;
  })();

  const filteredDonations = (() => {
    let result: Donation[] = [];
    if (filter === "ALL") {
      result = searchAndTypeFilteredDonations;
    } else if (filter === "CONFIRMED") {
      result = searchAndTypeFilteredDonations.filter((d) => d.status === "CONFIRMED");
    } else {
      result = searchAndTypeFilteredDonations.filter((d) => d.status === filter);
    }

    if (filter === "CANCELLED") {
      return result.sort((a, b) => {
        const timeA = new Date(a.cancelled_at || a.created_at).getTime();
        const timeB = new Date(b.cancelled_at || b.created_at).getTime();
        return timeB - timeA;
      });
    }

    // Ensure the array is always sorted newest-first
    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  })();

  const searchedDonations = filteredDonations;

  // For FULFILLED filter, group by need item
  const groupedFulfilledDonations: Record<number, Donation[]> =
    filter === "FULFILLED"
      ? groupDonationsByNeedItem(searchedDonations)
      : {};

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user?.role !== "ORG_ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const viewDialogContent = (() => {
    if (!selectedDonation) return null;

    const donation = selectedDonation;
    const needName = needsMap.get(donation.need_item)?.name || "Unknown Need";

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-10 z-[1100] w-screen h-screen">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] animate-in my-auto shrink-0 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b shrink-0">
            <h3 className="text-xl font-bold text-gray-900">
              Pledge Details
            </h3>
            <button
              onClick={handleCloseViewDialog}
              className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
            >
              Close
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 text-sm overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">Need Item</span>
              <span className="sm:col-span-2 text-gray-900 text-sm break-words">{needName}</span>
            </div>

            {needsMap.get(donation.need_item)?.section_detail?.name && (
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">Section</span>
                <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                  {needsMap.get(donation.need_item)?.section_detail?.name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">Quantity</span>
              <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                {donation.quantity} {donation.need_item_detail?.unit || "UNIT"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">Donor Type</span>
              <span className="sm:col-span-2 text-gray-900 text-sm break-words capitalize">
                {donation.donor_type === "private"
                  ? "Private Donor"
                  : "Government"}
              </span>
            </div>

            {donation.donor_type === "private" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Donor Name</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_name || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Contact Person
                  </span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_contact || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Contact Number
                  </span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_phone || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Email</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_email || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Organization
                  </span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_organization || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Address</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.donor_address || "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Department</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_department || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Program</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_program || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Officer Name
                  </span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_officer_name || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Designation</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_officer_designation || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Contact Number
                  </span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_officer_contact || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Email</span>
                  <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                    {donation.government_email || "N/A"}
                  </span>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">Message</span>
              <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                {donation.message || "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">
                Estimated Delivery
              </span>
              <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                {donation.estimated_delivery_date
                  ? new Date(
                    donation.estimated_delivery_date,
                  ).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            {(donation.status === "CONFIRMED" ||
              donation.status === "FULFILLED") &&
              donation.confirmed_by_name && (
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Confirmed By
                  </span>
                  <span className="sm:col-span-2 text-gray-900 font-semibold text-green-700 text-sm break-words">
                    {donation.confirmed_by_name}
                    {donation.confirmed_by_role && ` (${donation.confirmed_by_role.replace("_", " ")})`}
                  </span>
                </div>
              )}

            {donation.status === "FULFILLED" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">
                  Received By
                </span>
                <span className="sm:col-span-2 text-gray-900 font-semibold text-purple-700 text-sm break-words">
                  {donation.received_by_name || "N/A"}
                  {donation.received_by_role && ` (${donation.received_by_role.replace("_", " ")})`}
                </span>
              </div>
            )}

            {donation.status === "CANCELLED" && donation.cancelled_by_name && (
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">Cancelled By</span>
                <span className="sm:col-span-2 text-gray-900 font-semibold text-red-700 text-sm break-words">
                  {donation.cancelled_by_name}
                  {donation.cancelled_by_role && ` (${donation.cancelled_by_role.replace("_", " ")})`}
                </span>
              </div>
            )}

            {donation.status === "CANCELLED" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-100 pb-2 gap-1 sm:gap-4">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">Reason</span>
                <span className="sm:col-span-2 text-gray-900 text-sm break-words">
                  {donation.cancellation_reason || "No reason provided"}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t shrink-0 flex justify-end">
            <button
              onClick={handleCloseViewDialog}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  })();

  // Confirmation Dialog Modal
  const confirmationDialogContent = (() => {
    if (!confirmDialog.isOpen || !confirmDialog.donationDetails) return null;

    const donation = confirmDialog.donationDetails;
    const isConfirm = confirmDialog.type === "confirm";
    const need = needsMap.get(donation.need_item);
    const remainingNeeded = need ? Math.max(0, need.quantity_required - need.quantity_confirmed) : 0;
    const hasOverAllocation = isConfirm && donation.quantity > remainingNeeded;

    if (isReasonStep && !isConfirm) {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="text-red-600" size={24} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Reason for Cancellation
            </h3>

            <p className="text-gray-600 text-center mb-4 text-sm">
              Please specify the reason for cancelling this donation.
            </p>

            <div className="mb-4">
              <label htmlFor="admin-cancel-reason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Cancellation Reason
              </label>
              <select
                id="admin-cancel-reason"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white text-gray-900 font-medium transition"
                required
              >
                <option value="" disabled>Select a reason...</option>
                <option value="Hospital has already received enough supply of this item">Hospital has already received enough supply</option>
                <option value="Pledged items do not match required medical specifications/standards">Pledged items do not match medical specifications/standards</option>
                <option value="Donor is unresponsive or unable to deliver after multiple contact attempts">Donor is unresponsive or unable to deliver</option>
                <option value="Duplicate or incorrect pledge entry">Duplicate or incorrect pledge entry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {cancelReasonOption === "Other" && (
              <div className="mb-6 animate-fade-in">
                <label htmlFor="admin-cancel-other" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Please specify
                </label>
                <textarea
                  id="admin-cancel-other"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please specify your cancellation reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm min-h-[100px] text-gray-900"
                  required
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsReasonStep(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
                disabled={cancelling !== null}
              >
                Back
              </button>
              <button
                onClick={handleCancelApprove}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition"
                disabled={cancelling !== null || !cancelReasonOption || (cancelReasonOption === "Other" && !cancelReason.trim())}
              >
                {cancelling !== null ? "Cancelling..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isReceive = confirmDialog.type === "receive";

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100] px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isConfirm ? "bg-green-100" : isReceive ? "bg-purple-100" : "bg-red-100"
                }`}
            >
              {isConfirm ? (
                <CheckCircle2 className="text-green-600" size={24} />
              ) : isReceive ? (
                <Gift className="text-purple-600" size={24} />
              ) : (
                <XCircle className="text-red-600" size={24} />
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            {isConfirm ? "Confirm Donation?" : isReceive ? "Mark Donation Received?" : "Cancel Donation?"}
          </h3>

          <p className="text-gray-600 text-center mb-4 text-sm leading-relaxed">
            {isConfirm
              ? "Are you sure you want to confirm this donation?"
              : isReceive
                ? "Are you sure you want to mark this donation as physically received? This will send a thank-you acknowledgment email to the donor."
                : "Are you sure you want to cancel this donation?"}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Need Item:</span>
              <span className="text-gray-900 font-medium">
                {donation.need_item_detail?.name ||
                  `Need ${donation.need_item}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity:</span>
              <span className="text-gray-900 font-medium">
                {donation.quantity} {donation.need_item_detail?.unit || "units"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Donor:</span>
              <span className="text-gray-900 font-medium">
                {donation.donor_type === "private"
                  ? donation.donor_name
                  : donation.government_department}
              </span>
            </div>
          </div>

          {hasOverAllocation && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm animate-in fade-in duration-200">
              <div className="font-semibold mb-2 text-amber-800 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Over-allocation Notice
              </div>
              {remainingNeeded > 0 ? (
                <div className="space-y-3">
                  <p className="text-amber-700 leading-relaxed">
                    This request (<strong>{donation.quantity} {donation.need_item_detail?.unit || "units"}</strong>) exceeds the remaining needed quantity of <strong>{remainingNeeded} {donation.need_item_detail?.unit || "units"}</strong>. How would you like to handle this?
                  </p>
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="confirmOption"
                        value="remaining"
                        checked={confirmOption === "remaining"}
                        onChange={() => setConfirmOption("remaining")}
                        className="mt-1 accent-amber-600 cursor-pointer"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900 transition text-[13px]">
                        Confirm remaining needed only (<strong>{remainingNeeded} {donation.need_item_detail?.unit || "units"}</strong>)
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Split and auto-cancel the surplus of <strong>{donation.quantity - remainingNeeded} {donation.need_item_detail?.unit || "units"}</strong>.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="confirmOption"
                        value="full"
                        checked={confirmOption === "full"}
                        onChange={() => setConfirmOption("full")}
                        className="mt-1 accent-amber-600 cursor-pointer"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900 transition text-[13px]">
                        Confirm full amount (<strong>{donation.quantity} {donation.need_item_detail?.unit || "units"}</strong>)
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Accept full pledge and allow over-allocation.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-amber-700 leading-relaxed">
                  The required need for this item has already been fully met. Confirming this request will accept the full pledge of <strong>{donation.quantity} {donation.need_item_detail?.unit || "units"}</strong> and result in over-allocation.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  type: null,
                  donationId: null,
                  donationDetails: null,
                })
              }
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
              disabled={confirming !== null || cancelling !== null || receiving !== null}
            >
              Back
            </button>
            <button
              onClick={isConfirm ? handleConfirmApprove : isReceive ? handleReceiveApprove : () => setIsReasonStep(true)}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition ${isConfirm
                ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                : isReceive
                  ? "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                }`}
              disabled={confirming !== null || cancelling !== null || receiving !== null}
            >
              {confirming !== null || cancelling !== null || receiving !== null
                ? confirming !== null
                  ? "Confirming..."
                  : cancelling !== null
                    ? "Cancelling..."
                    : "Processing..."
                : isConfirm
                  ? "Confirm"
                  : isReceive
                    ? "Received"
                    : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    );
  })();

  const activeChartSectionName = chartSectionFilter === "ALL"
    ? "All Sections"
    : sections.find((s) => s.id === chartSectionFilter)?.name || "Unknown Section";

  // Calculations for Pie Chart 1: Needs Fulfillment Status
  const chartFilteredNeeds = Array.from(needsMap.values()).filter((need) => {
    if (chartSectionFilter === "ALL") return true;
    return need.section === chartSectionFilter;
  });


  const totalNeedsCount = chartFilteredNeeds.length;
  const fullyReceivedNeedsCount = chartFilteredNeeds.filter(
    (n) => n.quantity_received >= n.quantity_required && n.quantity_required > 0
  ).length;
  const pendingNeedsCount = totalNeedsCount - fullyReceivedNeedsCount;

  const chart1Data = [
    {
      name: "100% Received Needs",
      value: fullyReceivedNeedsCount,
      percentage: totalNeedsCount > 0 ? ((fullyReceivedNeedsCount / totalNeedsCount) * 100).toFixed(1) : "0.0",
    },
    {
      name: "Pending/Partial Needs",
      value: pendingNeedsCount,
      percentage: totalNeedsCount > 0 ? ((pendingNeedsCount / totalNeedsCount) * 100).toFixed(1) : "0.0",
    },
  ];

  const CHART1_COLORS = ["#10B981", "#F59E0B"];

  // Calculations for Pie Chart 2: Quantity Fulfillment Status
  const totalRequiredQuantity = chartFilteredNeeds.reduce((sum, n) => sum + n.quantity_required, 0);
  const totalReceivedQuantity = chartFilteredNeeds.reduce((sum, n) => sum + n.quantity_received, 0);
  const remainingQuantityRequired = Math.max(0, totalRequiredQuantity - totalReceivedQuantity);

  const chart2Data = [
    {
      name: "Physically Received Quantity",
      value: totalReceivedQuantity,
      percentage: totalRequiredQuantity > 0 ? ((totalReceivedQuantity / totalRequiredQuantity) * 100).toFixed(1) : "0.0",
    },
    {
      name: "Remaining Quantity Required",
      value: remainingQuantityRequired,
      percentage: totalRequiredQuantity > 0 ? ((remainingQuantityRequired / totalRequiredQuantity) * 100).toFixed(1) : "0.0",
    },
  ];

  const CHART2_COLORS = ["#6366F1", "#94A3B8"];


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="page-header-container">
        <h1 className="page-title">
          Donation Management
        </h1>
        <p className="page-subtitle">
          Review and confirm donations from donors
        </p>
      </div>



        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            {error}
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED", "ALL"].map(
              (status) => {
                let count = 0;
                if (status === "ALL") {
                  count = searchAndTypeFilteredDonations.length;
                } else if (status === "CONFIRMED") {
                  count = searchAndTypeFilteredDonations.filter(
                    (d) => d.status === "CONFIRMED",
                  ).length;
                } else if (status === "FULFILLED") {
                  // Count actual fulfilled requests (donations)
                  count = searchAndTypeFilteredDonations.filter(
                    (d) => d.status === "FULFILLED",
                  ).length;
                } else {
                  count = searchAndTypeFilteredDonations.filter((d) => d.status === status).length;
                }

                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${filter === status
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-900"
                      }`}
                  >
                    {status}
                    <span className="ml-2 text-sm">({count})</span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Filter Controls Row: Search bar & dropdown filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="search-bar-container">
            <Search className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search by need, donor name/email, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Donor Type Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="donor-type-filter" className="form-label mb-0 whitespace-nowrap">
                Filter Table by:
              </label>
              <select
                id="donor-type-filter"
                value={donorTypeFilter}
                onChange={(e) => setDonorTypeFilter(e.target.value)}
                className="form-select px-3 py-1.5 font-medium bg-white text-gray-900"
              >
                <option value="ALL">All Donor Types</option>
                <option value="private">Private Donor</option>
                <option value="government">Government</option>
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="section-filter" className="form-label mb-0 whitespace-nowrap">
                Filter Table by:
              </label>
              <select
                id="section-filter"
                value={sectionFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  const params = new URLSearchParams(searchParams.toString());
                  if (val === "ALL") {
                    params.delete("section");
                  } else {
                    params.set("section", val);
                  }
                  const newSearch = params.toString();
                  router.push(`/admin/donations${newSearch ? `?${newSearch}` : ""}`);
                }}
                className="form-select px-3 py-1.5 font-medium bg-white text-gray-900"
              >
                <option value="ALL">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper overflow-x-auto w-full max-w-full">
          {filteredDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No donations found for this filter
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full max-w-full">
              <table className="w-full min-w-[1300px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="table-th sticky top-0 z-10">
                      Status
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Need Item
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Created Date
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Section
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Required Quantity
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Received Quantity
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Confirmed Quantity
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Needed Quantity
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Requested Quantity
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Donor Type
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Donor Info
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Requested Date
                    </th>
                    <th className="table-th sticky top-0 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filter === "FULFILLED"
                    ? // For FULFILLED donations, group by need item and show all donors
                    Object.entries(groupedFulfilledDonations)
                      .sort(
                        ([, a], [, b]) =>
                          new Date(b[0].created_at).getTime() -
                          new Date(a[0].created_at).getTime(),
                      )
                      .map(([needId, needDonations]) => {
                        const firstDonation = needDonations[0];
                        const totalQuantity = needDonations.reduce(
                          (sum, d) => sum + d.quantity,
                          0,
                        );
                        return (
                          <tr
                            key={needId}
                            className="table-tr-hover"
                          >
                            <td className="table-td">
                              <div className="flex items-center gap-2">
                                {getStatusIcon("FULFILLED")}
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge("FULFILLED")}`}
                                >
                                  FULFILLED
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="font-medium text-gray-900">
                                {firstDonation.need_item_detail?.name ||
                                  `Need ${firstDonation.need_item}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {needsMap.get(firstDonation.need_item)?.created_at
                                ? new Date(needsMap.get(firstDonation.need_item)!.created_at).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {needsMap.get(firstDonation.need_item)
                                ?.section_detail?.name || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {needsMap.get(firstDonation.need_item)
                                ?.quantity_required
                                ? `${needsMap.get(firstDonation.need_item)?.quantity_required} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-purple-700 font-medium">
                              {`${totalQuantity} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-green-700 font-medium">
                              {needsMap.get(firstDonation.need_item)
                                ?.quantity_confirmed !== undefined
                                ? `${needsMap.get(firstDonation.need_item)?.quantity_confirmed} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`
                                : "-"}
                            </td>
                            <td className={`px-6 py-4 text-sm font-medium ${Math.max(0, (needsMap.get(firstDonation.need_item)?.quantity_required || 0) - (needsMap.get(firstDonation.need_item)?.quantity_confirmed || 0)) > 0
                              ? "text-red-600"
                              : "text-green-600"
                              }`}>
                              {needsMap.get(firstDonation.need_item)
                                ? `${Math.max(0, (needsMap.get(firstDonation.need_item)?.quantity_required || 0) - (needsMap.get(firstDonation.need_item)?.quantity_confirmed || 0))} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="space-y-2">
                                {needDonations.map((donation, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center py-1"
                                  >
                                    {donation.quantity}{" "}
                                    {donation.need_item_detail?.unit ||
                                      "units"}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="space-y-2">
                                {needDonations.map((donation, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center py-1"
                                  >
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${donation.donor_type === "private" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                                    >
                                      {donation.donor_type === "private"
                                        ? "Private"
                                        : "Government"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="space-y-2">
                                {needDonations.map((donation, idx) => (
                                  <div key={idx} className="py-1">
                                    <div className="text-gray-900 font-medium text-xs">
                                      {donation.donor_type === "private"
                                        ? donation.donor_name
                                        : donation.government_department}
                                    </div>
                                    {(donation.donor_type === "private"
                                      ? donation.donor_email
                                      : donation.government_email) && (
                                        <div className="text-gray-500 text-[10px]">
                                          {donation.donor_type === "private"
                                            ? donation.donor_email
                                            : donation.government_email}
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="space-y-2">
                                {needDonations.map((donation, idx) => (
                                  <div
                                    key={idx}
                                    className="py-1 flex items-center whitespace-nowrap text-xs"
                                  >
                                    {new Date(
                                      donation.created_at,
                                    ).toLocaleDateString()}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="space-y-2">
                                {needDonations.map((donation, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center py-1"
                                  >
                                    <button
                                      onClick={() => setViewDialog(donation)}
                                      className="btn btn-primary px-3 py-1 text-xs"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : // For other statuses, show one row per donation
                    searchedDonations.map((donation) => {
                      const displayStatus =
                        filter === "CONFIRMED"
                          ? "CONFIRMED"
                          : donation.status;
                      return (
                        <tr
                          key={donation.id}
                          className="table-tr-hover"
                        >
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(displayStatus)}
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(displayStatus)}`}
                              >
                                {displayStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">
                              {donation.need_item_detail?.name ||
                                `Need ${donation.need_item}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {needsMap.get(donation.need_item)?.created_at
                              ? new Date(needsMap.get(donation.need_item)!.created_at).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {needsMap.get(donation.need_item)?.section_detail
                              ?.name || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {needsMap.get(donation.need_item)
                              ?.quantity_required
                              ? `${needsMap.get(donation.need_item)?.quantity_required} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-purple-700 font-medium">
                            {needsMap.get(donation.need_item)
                              ?.quantity_received !== undefined
                              ? `${needsMap.get(donation.need_item)?.quantity_received} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-green-700 font-medium">
                            {needsMap.get(donation.need_item)
                              ?.quantity_confirmed !== undefined
                              ? `${needsMap.get(donation.need_item)?.quantity_confirmed} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
                              : "-"}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium ${Math.max(0, (needsMap.get(donation.need_item)?.quantity_required || 0) - (needsMap.get(donation.need_item)?.quantity_confirmed || 0)) > 0
                            ? "text-red-600"
                            : "text-green-600"
                            }`}>
                            {needsMap.get(donation.need_item)
                              ? `${Math.max(0, (needsMap.get(donation.need_item)?.quantity_required || 0) - (needsMap.get(donation.need_item)?.quantity_confirmed || 0))} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {donation.quantity}{" "}
                            {donation.need_item_detail?.unit || "units"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${donation.donor_type === "private" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                            >
                              {donation.donor_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-gray-900 font-medium">
                              {donation.donor_type === "private"
                                ? donation.donor_name
                                : donation.government_department}
                            </div>
                            {(donation.donor_type === "private"
                              ? donation.donor_email
                              : donation.government_email) && (
                                <div className="text-gray-600 text-xs">
                                  {donation.donor_type === "private"
                                    ? donation.donor_email
                                    : donation.government_email}
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(
                              donation.created_at,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              {" "}
                              <button
                                onClick={() => setViewDialog(donation)}
                                className="btn btn-primary px-3 py-1 text-xs"
                              >
                                View
                              </button>{" "}
                              {donation.status === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => handleConfirm(donation.id)}
                                    disabled={confirming === donation.id}
                                    className="btn btn-success px-3 py-1 text-xs disabled:opacity-50"
                                  >
                                    {confirming === donation.id
                                      ? "Confirming..."
                                      : "Confirm"}
                                  </button>
                                  <button
                                    onClick={() => handleCancel(donation.id)}
                                    disabled={cancelling === donation.id}
                                    className="btn btn-danger px-3 py-1 text-xs disabled:opacity-50"
                                  >
                                    {cancelling === donation.id
                                      ? "Cancelling..."
                                      : "Cancel"}
                                  </button>
                                </>
                              )}
                              {donation.status === "CONFIRMED" && (
                                <>
                                  <button
                                    onClick={() => handleReceive(donation.id)}
                                    disabled={receiving === donation.id}
                                    className="btn btn-primary bg-purple-600 hover:bg-purple-700 px-3 py-1 text-xs disabled:opacity-50"
                                  >
                                    {receiving === donation.id
                                      ? "Receiving..."
                                      : "Receive"}
                                  </button>
                                  <button
                                    onClick={() => handleCancel(donation.id)}
                                    disabled={cancelling === donation.id}
                                    className="btn btn-danger px-3 py-1 text-xs disabled:opacity-50"
                                  >
                                    {cancelling === donation.id
                                      ? "Cancelling..."
                                      : "Cancel"}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6 mt-8">
          {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"].map((status) => {
            let count = 0;
            let totalQuantity = 0;

            if (status === "CONFIRMED") {
              const confirmedDonations = searchAndTypeFilteredDonations.filter(
                (d) => d.status === "CONFIRMED",
              );
              count = confirmedDonations.length;
              totalQuantity = confirmedDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else if (status === "FULFILLED") {
              const fulfilledDonations = searchAndTypeFilteredDonations.filter(
                (d) => d.status === "FULFILLED",
              );
              count = fulfilledDonations.length;
              totalQuantity = fulfilledDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else {
              const standardDonations = searchAndTypeFilteredDonations.filter(
                (d) => d.status === status,
              );
              count = standardDonations.length;
              totalQuantity = standardDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            }

            const bgColors: Record<string, string> = {
              PENDING: "bg-amber-50 border-amber-200",
              CONFIRMED: "bg-emerald-50 border-emerald-200",
              FULFILLED: "bg-purple-50 border-purple-200",
              CANCELLED: "bg-rose-50 border-rose-200",
            };
            const titleColors: Record<string, string> = {
              PENDING: "text-amber-800",
              CONFIRMED: "text-emerald-800",
              FULFILLED: "text-purple-800",
              CANCELLED: "text-rose-800",
            };
            const numColors: Record<string, string> = {
              PENDING: "text-amber-950",
              CONFIRMED: "text-emerald-950",
              FULFILLED: "text-purple-950",
              CANCELLED: "text-rose-950",
            };

            return (
              <div
                key={status}
                className={`rounded-xl border shadow-sm p-6 ${bgColors[status]}`}
              >
                <div className={`text-sm font-bold ${titleColors[status]}`}>
                  {status}
                  <span className="block text-xs font-medium opacity-80 mt-0.5">
                    Requests
                  </span>
                </div>
                <div
                  className={`text-3xl font-black mt-2 ${numColors[status]}`}
                >
                  {count}
                </div>
                <div
                  className={`text-sm mt-2 font-medium opacity-80 ${titleColors[status]}`}
                >
                  Total: {totalQuantity} units
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Analytics Section */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Visual Analytics Overview
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Visualizing needs and quantity fulfillment metrics
              </p>
            </div>

            {/* Separate Dropdown Filter for both charts */}
            <div className="flex items-center gap-2">
              <label htmlFor="chart-section-filter" className="text-sm text-gray-600 font-medium">
                Filter Charts by:
              </label>
              <select
                id="chart-section-filter"
                value={chartSectionFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setChartSectionFilter(val === "ALL" ? "ALL" : Number(val));
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium transition"
              >
                <option value="ALL">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Needs Fulfillment Status */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/50 p-6 flex flex-col justify-between h-[300px]">
              <div>
                <h3 className="text-base font-bold text-slate-800">Needs Fulfillment Overview ({activeChartSectionName})</h3>
                <p className="text-xs text-slate-500 mt-1">Comparison of fully met needs vs. pending/partial needs</p>
              </div>

              {totalNeedsCount > 0 ? (
                <div className="flex items-center justify-between flex-1 mt-4">
                  <div className="w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chart1Data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chart1Data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART1_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex-1 flex flex-col justify-center pl-6 space-y-3">
                    {chart1Data.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2.5">
                        <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: CHART1_COLORS[index] }} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{entry.name}</p>
                          <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                            {entry.value} {entry.value === 1 ? 'need' : 'needs'} ({entry.percentage}%)
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 font-medium">Total Created Needs: <span className="font-bold text-slate-600">{totalNeedsCount}</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                  No needs data available to display chart.
                </div>
              )}
            </div>

            {/* Chart 2: Quantity Fulfillment Status */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/50 p-6 flex flex-col justify-between h-[300px]">
              <div>
                <h3 className="text-base font-bold text-slate-800">Quantity Fulfillment Overview ({activeChartSectionName})</h3>
                <p className="text-xs text-slate-500 mt-1">Comparison of physically received quantity vs. remaining required quantity</p>
              </div>

              {totalRequiredQuantity > 0 ? (
                <div className="flex items-center justify-between flex-1 mt-4">
                  <div className="w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chart2Data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chart2Data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART2_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex-1 flex flex-col justify-center pl-6 space-y-3">
                    {chart2Data.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2.5">
                        <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: CHART2_COLORS[index] }} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{entry.name}</p>
                          <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                            {entry.value.toLocaleString()} units ({entry.percentage}%)
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 font-medium">Total Required Qty: <span className="font-bold text-slate-600">{totalRequiredQuantity.toLocaleString()} units</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                  No quantity data available to display chart.
                </div>
              )}
            </div>
        </div>
      </div>

      {confirmationDialogContent}
      {viewDialogContent}
    </div>
  );
}

export default function DonationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }>
      <DonationsContent />
    </Suspense>
  );
}
