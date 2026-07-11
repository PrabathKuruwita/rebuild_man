"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  AdminApprovalRequest as ApprovalRequest,
  getAdminApprovals,
  approveOrgAdmin,
  rejectOrgAdmin,
  getApprovedOrgAdmins,
  getRejectedOrgAdmins,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Check, X, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";

interface ConfirmationDialog {
  isOpen: boolean;
  type: "approve" | "reject" | null;
  userId: number | null;
  userName: string;
}

function sortByNewest(requests: ApprovalRequest[]): ApprovalRequest[] {
  return [...requests].sort((a, b) => {
    const dateA = a.approval_decided_at || a.approval_requested_at || "";
    const dateB = b.approval_decided_at || b.approval_requested_at || "";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

const ORG_TYPES = [
  { value: "ALL", label: "All Organization Types" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "SCHOOL", label: "School" },
  { value: "NGO", label: "NGO" },
  { value: "CHARITY", label: "Charity" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ApprovalRequest[]>(
    [],
  );
  const [rejectedRequests, setRejectedRequests] = useState<ApprovalRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: null,
    userId: null,
    userName: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgType, setSelectedOrgType] = useState("ALL");

  const filterRequests = (requests: ApprovalRequest[]) => {
    return requests.filter((req) => {
      const fullName = `${req.first_name || ""} ${req.last_name || ""}`.toLowerCase();
      const username = (req.username || "").toLowerCase();
      const orgName = (req.organization_name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      
      const matchesSearch =
        fullName.includes(query) ||
        username.includes(query) ||
        orgName.includes(query);
        
      const matchesOrgType =
        selectedOrgType === "ALL" ||
        (req.organization_type || "").toUpperCase().includes(selectedOrgType.toUpperCase());
        
      return matchesSearch && matchesOrgType;
    });
  };

  const filteredPending = filterRequests(pendingRequests);
  const filteredApproved = filterRequests(approvedRequests);
  const filteredRejected = filterRequests(rejectedRequests);

  useEffect(() => {
    let cancelled = false;

    const loadAllApprovals = async () => {
      try {
        setLoading(true);
        setError("");
        const [pending, approved, rejected] = await Promise.all([
          getAdminApprovals(),
          getApprovedOrgAdmins(),
          getRejectedOrgAdmins(),
        ]);

        if (cancelled) return;

        setPendingRequests(sortByNewest(pending));
        setApprovedRequests(sortByNewest(approved));
        setRejectedRequests(sortByNewest(rejected));
      } catch (err: unknown) {
        if (!cancelled) {
          setError("Failed to load approval requests");
          console.error(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAllApprovals();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleApprove = async (id: number) => {
    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    setConfirmDialog({
      isOpen: true,
      type: "approve",
      userId: id,
      userName: `${request.first_name} ${request.last_name}`,
    });
  };

  const handleApproveConfirm = async () => {
    if (!confirmDialog.userId) return;

    try {
      const result = await approveOrgAdmin(confirmDialog.userId);
      setPendingRequests((current) =>
        current.filter((r) => r.id !== confirmDialog.userId),
      );
      const approvedUser = result.user;
      if (approvedUser) {
        setApprovedRequests((current) => [...current, approvedUser]);
      }
      setConfirmDialog({
        isOpen: false,
        type: null,
        userId: null,
        userName: "",
      });
      alert("Admin approved successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
      setConfirmDialog({
        isOpen: false,
        type: null,
        userId: null,
        userName: "",
      });
    }
  };

  const handleReject = async (id: number) => {
    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    setRejectingId(id);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    const request = pendingRequests.find((r) => r.id === rejectingId);
    if (!request) return;

    setConfirmDialog({
      isOpen: true,
      type: "reject",
      userId: rejectingId,
      userName: `${request.first_name} ${request.last_name}`,
    });
  };

  const handleRejectConfirmationAccept = async () => {
    if (!confirmDialog.userId) return;

    try {
      const result = await rejectOrgAdmin(
        confirmDialog.userId,
        rejectionReason,
      );
      setPendingRequests((current) =>
        current.filter((r) => r.id !== confirmDialog.userId),
      );
      const rejectedUser = result.user;
      if (rejectedUser) {
        setRejectedRequests((current) => [...current, rejectedUser]);
      }
      setRejectingId(null);
      setRejectionReason("");
      setConfirmDialog({
        isOpen: false,
        type: null,
        userId: null,
        userName: "",
      });
      alert("Request rejected successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
      setConfirmDialog({
        isOpen: false,
        type: null,
        userId: null,
        userName: "",
      });
      setRejectingId(null);
      setRejectionReason("");
    }
  };

  const handleConfirmCancel = () => {
    setConfirmDialog({ isOpen: false, type: null, userId: null, userName: "" });
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Access denied. Only system admins can view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">
          Organization Admin Approvals
        </h1>
        <p className="text-gray-500 mt-1 mb-3">
          Review and approve organization admins
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-1 py-4 font-medium text-sm border-b-2 transition ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-1 py-4 font-medium text-sm border-b-2 transition ${
                activeTab === "approved"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Approved ({approvedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-1 py-4 font-medium text-sm border-b-2 transition ${
                activeTab === "rejected"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Rejected ({rejectedRequests.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between transition-all duration-300 hover:shadow-md">
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search by name or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="relative w-full md:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Filter size={18} />
                </span>
                <select
                  value={selectedOrgType}
                  onChange={(e) => setSelectedOrgType(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all duration-200"
                >
                  {ORG_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
                </span>
              </div>
            </div>

            {/* Pending Requests Tab */}
            {activeTab === "pending" && (
              <div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600">
                      No pending approval requests
                    </p>
                  </div>
                ) : filteredPending.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                    <p className="text-gray-600">
                      No matching pending requests found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPending.map((req) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        isPending={true}
                        isExpanded={expandedCardId === req.id}
                        onToggleExpand={() =>
                          setExpandedCardId(
                            expandedCardId === req.id ? null : req.id,
                          )
                        }
                        rejectingId={rejectingId}
                        rejectionReason={rejectionReason}
                        onApprove={handleApprove}
                        onRejectStart={() => handleReject(req.id)}
                        onRejectCancel={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                        onRejectSubmit={handleRejectConfirm}
                        onReasonChange={(reason) => setRejectionReason(reason)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Approved Requests Tab */}
            {activeTab === "approved" && (
              <div>
                {approvedRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600">No approved admin requests</p>
                  </div>
                ) : filteredApproved.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                    <p className="text-gray-600">
                      No matching approved requests found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApproved.map((req) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        isPending={false}
                        isExpanded={expandedCardId === req.id}
                        onToggleExpand={() =>
                          setExpandedCardId(
                            expandedCardId === req.id ? null : req.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rejected Requests Tab */}
            {activeTab === "rejected" && (
              <div>
                {rejectedRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600">No rejected admin requests</p>
                  </div>
                ) : filteredRejected.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                    <p className="text-gray-600">
                      No matching rejected requests found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRejected.map((req) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        isPending={false}
                        isExpanded={expandedCardId === req.id}
                        onToggleExpand={() =>
                          setExpandedCardId(
                            expandedCardId === req.id ? null : req.id,
                          )
                        }
                        showReason={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Confirmation Modal */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 transform transition-all">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {confirmDialog.type === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </h2>
              <p className="text-gray-700 mb-8 text-base leading-relaxed">
                {confirmDialog.type === "approve"
                  ? `Do you want to approve ${confirmDialog.userName} as an Organization Administrator?`
                  : `Do you want to reject ${confirmDialog.userName}'s application?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirmDialog.type === "approve") {
                      handleApproveConfirm();
                    } else {
                      handleRejectConfirmationAccept();
                    }
                  }}
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition transform hover:scale-105 ${
                    confirmDialog.type === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Yes, {confirmDialog.type === "approve" ? "Approve" : "Reject"}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Request Card Component
interface RequestCardProps {
  req: ApprovalRequest;
  isPending: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  rejectingId?: number | null;
  rejectionReason?: string;
  onApprove?: (id: number) => void;
  onRejectStart?: () => void;
  onRejectCancel?: () => void;
  onRejectSubmit?: () => void;
  onReasonChange?: (reason: string) => void;
  showReason?: boolean;
}

function RequestCard({
  req,
  isPending,
  isExpanded = true,
  onToggleExpand,
  rejectingId,
  rejectionReason,
  onApprove,
  onRejectStart,
  onRejectCancel,
  onRejectSubmit,
  onReasonChange,
  showReason = false,
}: RequestCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {req.first_name} {req.last_name}
          </h3>
          <p className="text-gray-600">{req.email}</p>
          <p className="text-sm text-gray-500 mt-1">@{req.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              req.approval_status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : req.approval_status === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {req.approval_status}
          </span>
          <button
            onClick={onToggleExpand}
            className="text-gray-500 hover:text-gray-700 transition"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Organization Name
              </label>
              <p className="text-gray-900">{req.organization_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Organization Type
              </label>
              <p className="text-gray-900">{req.organization_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900">{req.phone_number || "N/A"}</p>
            </div>
            {req.approval_requested_at && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Requested On
                </label>
                <p className="text-gray-900">
                  {new Date(req.approval_requested_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            )}
            {req.approval_decided_at && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Decided On
                </label>
                <p className="text-gray-900">
                  {new Date(req.approval_decided_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            )}
            {req.approval_decided_by_username && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Decided By
                </label>
                <p className="text-gray-900">
                  {req.approval_decided_by_username === "admin" || req.approval_decided_by_username === "system_admin"
                    ? "System Admin"
                    : req.approval_decided_by_username}
                </p>
              </div>
            )}
          </div>

          {isPending && rejectingId !== req.id ? (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove && onApprove(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                <Check size={18} />
                Approve
              </button>
              <button
                onClick={() => onRejectStart && onRejectStart()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                <X size={18} />
                Reject
              </button>
            </div>
          ) : isPending && rejectingId === req.id ? (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  onReasonChange && onReasonChange(e.target.value)
                }
                placeholder="Reason for rejection..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => onRejectSubmit && onRejectSubmit()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => onRejectCancel && onRejectCancel()}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {showReason &&
            req.approval_status === "REJECTED" &&
            req.rejection_reason && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-sm text-red-800">
                  <strong>Rejection Reason:</strong> {req.rejection_reason}
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
