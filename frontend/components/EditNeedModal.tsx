"use client";

import { useState } from "react";
import { NeedItem, updateNeed, unitLabels } from "@/lib/api";

interface EditNeedModalProps {
  need: NeedItem;
  onClose: () => void;
  onSuccess: () => void;
}

const priorityConfig = {
  CRITICAL: {
    dot: "bg-red-500",
    ring: "ring-red-300",
    label: "Critical",
    desc: "Urgent — must be addressed immediately",
  },
  ESSENTIAL: {
    dot: "bg-yellow-500",
    ring: "ring-yellow-300",
    label: "Essential",
    desc: "Important but not life-threatening",
  },
  NICE: {
    dot: "bg-green-500",
    ring: "ring-green-300",
    label: "Nice to Have",
    desc: "Helpful but not urgent",
  },
};

export default function EditNeedModal({
  need,
  onClose,
  onSuccess,
}: EditNeedModalProps) {
  const [form, setForm] = useState({
    name: need.name,
    priority: need.priority,
    quantity_required: need.quantity_required,
    quantity_received: need.quantity_received,
    unit: need.unit,
    description: need.description ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Need name is required.");
      return;
    }
    if (form.quantity_required < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateNeed(need.id, {
        name: form.name.trim(),
        priority: form.priority,
        quantity_required: form.quantity_required,
        quantity_received: form.quantity_received,
        unit: form.unit,
        description: form.description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch {
      setError("Failed to update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-full w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Need</h2>
            <p className="text-indigo-200 text-sm mt-0.5">
              Update the details for this need item
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Updated!</h3>
              <p className="text-gray-500 text-sm">
                Changes saved successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Need Name */}
              <div>
                <label
                  htmlFor="need-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Need Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="need-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="Enter need item name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CRITICAL", "ESSENTIAL", "NICE"] as const).map((p) => {
                    const cfg = priorityConfig[p];
                    const selected = form.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${selected ? `border-current ring-2 ${cfg.ring} bg-gray-50` : "border-gray-200 hover:border-gray-300 bg-white"}`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                        <span
                          className={`text-xs font-semibold ${selected ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {priorityConfig[form.priority].desc}
                </p>
              </div>

              {/* Quantity Required + Received */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="quantity-required"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Quantity Required <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="quantity-required"
                    type="number"
                    min={1}
                    value={form.quantity_required}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity_required: parseInt(e.target.value) || 1,
                      }))
                    }
                    required
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quantity-received"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Quantity Received
                  </label>
                  <input
                    id="quantity-received"
                    type="number"
                    min={0}
                    value={form.quantity_received}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity_received: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g. 0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      unit: e.target.value as typeof form.unit,
                    }))
                  }
                  aria-label="Unit"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  {Object.entries(unitLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional details, specifications, context…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
