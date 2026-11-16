"use client";

import { NeedItem, priorityColors, priorityLabels, unitLabels } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { X, Building2, Layers, Calendar, Heart, LogIn, Edit3, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface NeedDetailsModalProps {
  need: NeedItem;
  isOpen: boolean;
  sectionName?: string;
  organizationName?: string;
  onClose: () => void;
  onOpenDonate?: () => void;
  onEdit?: () => void;
}

export default function NeedDetailsModal({
  need,
  isOpen,
  sectionName,
  organizationName,
  onClose,
  onOpenDonate,
  onEdit,
}: NeedDetailsModalProps) {
  const { user } = useAuth();

  if (!isOpen) return null;

  const progress =
    need.quantity_required > 0
      ? Math.min(((need.quantity_received || 0) / need.quantity_required) * 100, 100)
      : 0;

  const remaining = Math.max(0, need.quantity_required - need.quantity_confirmed);
  const displayOrg = organizationName || need.section_detail?.organization_name;
  const displaySection = sectionName || need.section_detail?.name;
  const unitLabel = unitLabels[need.unit] || need.unit || "Units";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-all duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg sm:max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Need Item Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review full specifications and fulfillment status
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 text-sm text-gray-700">
          {/* Main Title & Priority */}
          <div className="flex items-start justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-snug">
                {need.name}
              </h3>
              {(displayOrg || displaySection) && (
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-2 text-xs text-gray-600">
                  {displayOrg && (
                    <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                      <Building2 size={13} className="text-gray-400 shrink-0" />
                      <span className="break-words">{displayOrg}</span>
                    </span>
                  )}
                  {displaySection && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Layers size={13} className="text-gray-400 shrink-0" />
                      <span>{displaySection}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border shrink-0 ${priorityColors[need.priority]}`}
            >
              {priorityLabels[need.priority]}
            </span>
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Description
            </h4>
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 text-gray-800 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {need.description ? (
                need.description
              ) : (
                <span className="text-gray-400 italic">No description provided for this item.</span>
              )}
            </div>
          </div>

          {/* Progress & Metrics Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              <span>Fulfillment Progress</span>
              <span className="text-gray-900 font-extrabold">{progress.toFixed(0)}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className={`need-card__progress-fill ${
                  progress >= 100
                    ? "need-card__progress-fill--complete"
                    : progress >= 75
                      ? "need-card__progress-fill--75to100"
                      : progress >= 50
                        ? "need-card__progress-fill--50to75"
                        : progress >= 25
                          ? "need-card__progress-fill--25to50"
                          : "need-card__progress-fill--0to25"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-400">Required</span>
                <span className="text-sm font-bold text-gray-900">
                  {need.quantity_required}
                </span>
                <span className="block text-[10px] text-gray-500 font-medium">{unitLabel}</span>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-emerald-600">Confirmed</span>
                <span className="text-sm font-bold text-emerald-700">
                  {need.quantity_confirmed}
                </span>
                <span className="block text-[10px] text-emerald-600 font-medium">{unitLabel}</span>
              </div>
              <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-purple-600">Received</span>
                <span className="text-sm font-bold text-purple-700">
                  {need.quantity_received}
                </span>
                <span className="block text-[10px] text-purple-600 font-medium">{unitLabel}</span>
              </div>
              <div className={`p-3 rounded-xl text-center border ${remaining > 0 ? "bg-rose-50/70 border-rose-100" : "bg-emerald-50/70 border-emerald-100"}`}>
                <span className={`block text-[10px] uppercase font-bold ${remaining > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                  Still Needed
                </span>
                <span className={`text-sm font-bold ${remaining > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {remaining}
                </span>
                <span className={`block text-[10px] font-medium ${remaining > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                  {unitLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Creation date */}
          {need.created_at && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
              <Calendar size={13} />
              <span>Added on {new Date(need.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {((remaining > 0 && user?.role !== "ADMIN" && user?.role !== "ORG_ADMIN") ||
          remaining <= 0 ||
          ((user?.role === "ADMIN" || user?.role === "ORG_ADMIN") && !!onEdit)) && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 flex items-center justify-center gap-3 shrink-0">
            {/* Contextual Action based on user role */}
            {remaining > 0 && user?.role !== "ADMIN" && user?.role !== "ORG_ADMIN" && (
              <div className="w-full">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDonate?.();
                    }}
                    className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm active:scale-[0.99] cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <Heart size={16} />
                    Donate to this Need
                  </button>
                ) : (
                  <Link href="/login" className="block w-full">
                    <button
                      type="button"
                      className="w-full py-3 px-5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition shadow-sm active:scale-[0.99] cursor-pointer text-sm flex items-center justify-center gap-2"
                    >
                      <LogIn size={16} />
                      Sign in to Donate
                    </button>
                  </Link>
                )}
              </div>
            )}

            {remaining <= 0 && (
              <div className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold">
                <CheckCircle2 size={16} />
                Requirement Fulfilled
              </div>
            )}

            {(user?.role === "ADMIN" || user?.role === "ORG_ADMIN") && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="w-full py-3 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm active:scale-[0.99] cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Edit3 size={15} />
                Edit Need
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
