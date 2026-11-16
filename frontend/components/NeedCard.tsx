"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  NeedItem,
  priorityColors,
  priorityLabels,
  unitLabels,
} from "@/lib/api";
import DonateModal from "./DonateModal";
import NeedDetailsModal from "./NeedDetailsModal";
import { Heart, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import "./NeedCard.css";

interface NeedCardProps {
  need: NeedItem;
  showSection?: boolean;
  sectionName?: string;
  organizationName?: string;
  onDonationSuccess?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NeedCard({
  need,
  sectionName,
  organizationName,
  onDonationSuccess,
  onEdit,
  onDelete,
}: NeedCardProps) {
  const { user } = useAuth();
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const progress =
    need.quantity_required > 0
      ? Math.min(((need.quantity_received || 0) / need.quantity_required) * 100, 100)
      : 0;

  const remaining = need.quantity_required - need.quantity_confirmed;

  const handleDonationSuccess = () => {
    onDonationSuccess?.();
  };

  return (
    <>
      <div
        onClick={() => setIsDetailModalOpen(true)}
        className="bg-white rounded-none shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-teal-300 transition-all overflow-hidden cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors break-words line-clamp-2 leading-snug"
              title={need.name}
            >
              {need.name}
            </h3>
            {(organizationName || need.section_detail?.organization_name) && (
              <p
                className="text-xs text-gray-700 font-medium mt-0.5 truncate"
                title={`${organizationName || need.section_detail?.organization_name || ""}${(sectionName || need.section_detail?.name) ? ` • ${sectionName || need.section_detail?.name}` : ""}`}
              >
                {organizationName || need.section_detail?.organization_name}
                {(sectionName || need.section_detail?.name) && (
                  <span className="text-gray-500 font-normal">
                    {` • ${sectionName || need.section_detail?.name}`}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full border shrink-0 ${priorityColors[need.priority]}`}
            >
              {priorityLabels[need.priority]}
            </span>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Edit"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {need.description && (
          <p
            className="text-sm text-gray-600 mb-3 line-clamp-2 break-words"
            title={need.description}
          >
            {need.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Fulfillment Progress</span>
            <span className="font-medium text-gray-900">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`need-card__progress-fill ${progress >= 100
                  ? "need-card__progress-fill--complete"
                  : progress >= 75
                    ? "need-card__progress-fill--75to100"
                    : progress >= 50
                      ? "need-card__progress-fill--50to75"
                      : progress >= 25
                        ? "need-card__progress-fill--25to50"
                        : "need-card__progress-fill--0to25"
                }`}
              data-progress={Math.round(progress)}
            />
          </div>
        </div>

        {/* Quantities */}
        <div className="flex justify-between text-sm mb-4">
          <div>
            <span className="text-gray-500">Confirmed: </span>
            <span className="font-medium text-green-600">
              {need.quantity_confirmed} {unitLabels[need.unit]}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              ({need.quantity_received} received)
            </span>
          </div>
          <div>
            <span className="text-gray-500">Needed: </span>
            <span
              className={`font-medium ${remaining > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {remaining > 0 ? remaining : 0} {unitLabels[need.unit]}
            </span>
          </div>
        </div>

        {/* Donate Button - Hide for ADMIN and ORG_ADMIN users */}
        {remaining > 0 &&
          user?.role !== "ADMIN" &&
          user?.role !== "ORG_ADMIN" && (
            <div className="space-y-2 mt-4">
              {user ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDonateModalOpen(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Heart size={18} />
                  Donate
                </button>
              ) : (
                <Link href="/login" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} />
                    Sign in to Donate
                  </button>
                </Link>
              )}
              <div className="flex items-center justify-end text-[11px] text-gray-400 group-hover:text-teal-600 font-medium transition-colors pt-1">
                <span className="inline-flex items-center gap-1">
                  View full details
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          )}
        {remaining <= 0 && (
          <div className="space-y-2 mt-4">
            <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-full text-center font-medium text-sm">
              ✓ Requirement Fulfilled
            </div>
            <div className="flex items-center justify-end text-[11px] text-gray-400 group-hover:text-teal-600 font-medium transition-colors pt-1">
              <span className="inline-flex items-center gap-1">
                View full details
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        )}

        {/* Admin view without donate button (e.g. Org Admin / Admin console) */}
        {(user?.role === "ADMIN" || user?.role === "ORG_ADMIN") && remaining > 0 && (
          <div className="flex items-center justify-end pt-2 border-t border-gray-50 text-[11px] text-gray-400 group-hover:text-teal-600 font-medium transition-colors mt-2">
            <span className="inline-flex items-center gap-1">
              View full details
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        )}
      </div>

      {/* Donate Modal */}
      <DonateModal
        needItem={need}
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        onSuccess={handleDonationSuccess}
      />

      {/* Need Details Modal */}
      <NeedDetailsModal
        need={need}
        isOpen={isDetailModalOpen}
        sectionName={sectionName}
        organizationName={organizationName}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenDonate={() => setIsDonateModalOpen(true)}
        onEdit={onEdit}
      />
    </>
  );
}
