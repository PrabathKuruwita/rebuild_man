"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  Donation,
  NeedItem,
  getDonations,
  getOrganizations,
  confirmDonation,
  cancelDonation,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { useRouter } from "next/navigation";

interface DonationDialogState {
  isOpen: boolean;
  type: "confirm" | "cancel" | null;
  donationId: number | null;
  donationDetails: Donation | null;
}

export default function DonationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [needsMap, setNeedsMap] = useState<Map<number, NeedItem>>(new Map());
  const [confirmDialog, setConfirmDialog] = useState<DonationDialogState>({
    isOpen: false,
    type: null,
    donationId: null,
    donationDetails: null,
  });
  const [viewDialog, setViewDialog] = useState<Donation | null>(null);

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
  }, [user, authLoading, fetchDonations]);

  const handleConfirm = async (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    setConfirmDialog({
      isOpen: true,
      type: "confirm",
      donationId,
      donationDetails: donation ?? null,
    });
  };

  const handleConfirmApprove = async () => {
    if (!confirmDialog.donationId) return;

    setConfirming(confirmDialog.donationId);
    try {
      await confirmDonation(confirmDialog.donationId);
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
      await cancelDonation(confirmDialog.donationId);
      setConfirmDialog({
        isOpen: false,
        type: null,
        donationId: null,
        donationDetails: null,
      });
      await fetchDonations();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel donation",
      );
    } finally {
      setCancelling(null);
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

  const filteredDonations = (() => {
    let result: Donation[] = [];
    if (filter === "ALL") result = donations;
    else if (filter === "CONFIRMED")
      result = donations.filter(
        (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
      );
    else result = donations.filter((d) => d.status === filter);

    // Ensure the array is always sorted newest-first
    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  })();

  // For FULFILLED filter, group by need item
  const groupedFulfilledDonations: Record<number, Donation[]> =
    filter === "FULFILLED"
      ? groupDonationsByNeedItem(
          donations.filter((d) => d.status === "FULFILLED"),
        )
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
    if (!viewDialog) return null;

    const donation = viewDialog;
    const needName = needsMap.get(donation.need_item)?.name || "Unknown Need";

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-full flex flex-col animate-in">
          <div className="flex justify-between items-center p-6 border-b shrink-0">
            <h3 className="text-xl font-bold text-gray-900">
              Donation Details
            </h3>
            <button
              onClick={() => setViewDialog(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close donation details"
              title="Close"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
            <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-medium">Need Item</span>
              <span className="col-span-2 text-gray-900">{needName}</span>
            </div>

            {needsMap.get(donation.need_item)?.section_detail?.name && (
              <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Section</span>
                <span className="col-span-2 text-gray-900">
                  {needsMap.get(donation.need_item)?.section_detail?.name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-medium">Quantity</span>
              <span className="col-span-2 text-gray-900">
                {donation.quantity} {donation.need_item_detail?.unit || "UNIT"}
              </span>
            </div>

            <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-medium">Donor Type</span>
              <span className="col-span-2 text-gray-900 capitalize">
                {donation.donor_type === "private"
                  ? "Private Donor"
                  : "Government"}
              </span>
            </div>

            {donation.donor_type === "private" ? (
              <>
                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Donor Name</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.donor_name || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Contact Person
                  </span>
                  <span className="col-span-2 text-gray-900">
                    {donation.donor_contact || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Contact Number
                  </span>
                  <span className="col-span-2 text-gray-900">
                    {donation.donor_phone || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.donor_email || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Organization
                  </span>
                  <span className="col-span-2 text-gray-900">
                    {donation.donor_organization || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Address</span>
                  <span className="col-span-2 text-gray-900 truncate">
                    {donation.donor_address || "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Department</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_department || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Program</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_program || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Officer Name
                  </span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_officer_name || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Designation</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_officer_designation || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Contact Number
                  </span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_officer_contact || "N/A"}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="col-span-2 text-gray-900">
                    {donation.government_email || "N/A"}
                  </span>
                </div>
              </>
            )}

            <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-medium">Message</span>
              <span className="col-span-2 text-gray-900">
                {donation.message || "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-medium">
                Estimated Delivery
              </span>
              <span className="col-span-2 text-gray-900">
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
                <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium">
                    Confirmed By
                  </span>
                  <span className="col-span-2 text-gray-900 font-semibold text-green-700">
                    {donation.confirmed_by_name}
                  </span>
                </div>
              )}

            {donation.status === "CANCELLED" && donation.cancelled_by_name && (
              <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Cancelled By</span>
                <span className="col-span-2 text-gray-900 font-semibold text-red-700">
                  {donation.cancelled_by_name}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 border-t shrink-0 flex justify-end">
            <button
              onClick={() => setViewDialog(null)}
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

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isConfirm ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isConfirm ? (
                <CheckCircle2 className="text-green-600" size={24} />
              ) : (
                <XCircle className="text-red-600" size={24} />
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            {isConfirm ? "Confirm Donation?" : "Cancel Donation?"}
          </h3>

          <p className="text-gray-600 text-center mb-4 text-sm">
            {isConfirm
              ? "Are you sure you want to confirm this donation?"
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
              disabled={confirming !== null || cancelling !== null}
            >
              Back
            </button>
            <button
              onClick={isConfirm ? handleConfirmApprove : handleCancelApprove}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition ${
                isConfirm
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              }`}
              disabled={confirming !== null || cancelling !== null}
            >
              {confirming !== null || cancelling !== null
                ? isConfirm
                  ? "Confirming..."
                  : "Cancelling..."
                : isConfirm
                  ? "Confirm"
                  : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Donation Management
          </h1>
          <p className="text-gray-500 mt-1">
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

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED", "ALL"].map(
            (status) => {
              let count = 0;
              if (status === "ALL") {
                count = donations.length;
              } else if (status === "CONFIRMED") {
                count = donations.filter(
                  (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
                ).length;
              } else if (status === "FULFILLED") {
                // Count unique need items for FULFILLED tab
                const fulfilledDonations = donations.filter(
                  (d) => d.status === "FULFILLED",
                );
                const uniqueNeeds = new Set(
                  fulfilledDonations.map((d) => d.need_item),
                );
                count = uniqueNeeds.size;
              } else {
                count = donations.filter((d) => d.status === status).length;
              }

              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-3 font-medium border-b-2 transition ${
                    filter === status
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-900"
                  }`}
                >
                  {status}
                  {status !== "ALL" && (
                    <span className="ml-2 text-sm">({count})</span>
                  )}
                </button>
              );
            },
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No donations found for this filter
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Need Item
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Required Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Received Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Requested Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Donor Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Donor Info
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Requested Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
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
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
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
                                {needsMap.get(firstDonation.need_item)
                                  ?.section_detail?.name || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                {needsMap.get(firstDonation.need_item)
                                  ?.quantity_required
                                  ? `${needsMap.get(firstDonation.need_item)?.quantity_required} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-green-700 font-medium">
                                {needsMap.get(firstDonation.need_item)
                                  ?.quantity_received !== undefined
                                  ? `${needsMap.get(firstDonation.need_item)?.quantity_received} ${needsMap.get(firstDonation.need_item)?.unit || "UNIT"}`
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
                                <span className="text-gray-500 text-xs">
                                  No actions
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    : // For other statuses, show one row per donation
                      filteredDonations.map((donation) => {
                        const displayStatus =
                          filter === "CONFIRMED"
                            ? "CONFIRMED"
                            : donation.status;
                        return (
                          <tr
                            key={donation.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
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
                              {needsMap.get(donation.need_item)?.section_detail
                                ?.name || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {needsMap.get(donation.need_item)
                                ?.quantity_required
                                ? `${needsMap.get(donation.need_item)?.quantity_required} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-green-700 font-medium">
                              {needsMap.get(donation.need_item)
                                ?.quantity_received !== undefined
                                ? `${needsMap.get(donation.need_item)?.quantity_received} ${needsMap.get(donation.need_item)?.unit || "UNIT"}`
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
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition"
                                >
                                  View
                                </button>{" "}
                                {donation.status === "PENDING" && (
                                  <>
                                    <button
                                      onClick={() => handleConfirm(donation.id)}
                                      disabled={confirming === donation.id}
                                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs font-medium transition"
                                    >
                                      {confirming === donation.id
                                        ? "Confirming..."
                                        : "Confirm"}
                                    </button>
                                    <button
                                      onClick={() => handleCancel(donation.id)}
                                      disabled={cancelling === donation.id}
                                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs font-medium transition"
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
              const confirmedAndFulfilled = donations.filter(
                (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
              );
              count = confirmedAndFulfilled.length;
              totalQuantity = confirmedAndFulfilled.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else if (status === "FULFILLED") {
              const fulfilledDonations = donations.filter(
                (d) => d.status === "FULFILLED",
              );
              const uniqueNeeds = new Set(
                fulfilledDonations.map((d) => d.need_item),
              );
              count = uniqueNeeds.size;
              totalQuantity = fulfilledDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else {
              const standardDonations = donations.filter(
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
                  {status === "FULFILLED" && (
                    <span className="block text-xs font-medium opacity-80 mt-0.5">
                      Needs
                    </span>
                  )}
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
      </div>

      {confirmationDialogContent}
      {viewDialogContent}
    </div>
  );
}
