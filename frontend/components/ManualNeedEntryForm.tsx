"use client";

import { useEffect, useState } from "react";
import {
  getOrganizations,
  createNeed,
  Organization,
  unitLabels,
} from "@/lib/api";

interface ManualNeedEntryFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialOrgId?: number;
  initialSectionId?: number;
}

const defaultForm = {
  name: "",
  priority: "ESSENTIAL" as "CRITICAL" | "ESSENTIAL" | "NICE",
  quantity_required: 1,
  unit: "UNIT" as "UNIT" | "BOX" | "KG" | "LITER",
  description: "",
  organization_id: "",
  section_id: "",
};

export default function ManualNeedEntryForm({
  onClose,
  onSuccess,
  initialOrgId,
  initialSectionId,
}: ManualNeedEntryFormProps) {
  const [form, setForm] = useState({
    ...defaultForm,
    organization_id: initialOrgId ? String(initialOrgId) : "",
    section_id: initialSectionId ? String(initialSectionId) : "",
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getOrganizations()
      .then(setOrganizations)
      .catch(() =>
        setError(
          "Could not load organizations. Make sure the backend is running.",
        ),
      )
      .finally(() => setLoadingOrgs(false));
  }, []);

  const selectedOrg = organizations.find(
    (o) => o.id.toString() === form.organization_id,
  );
  const sections = selectedOrg?.sections ?? [];

  function handleOrgChange(orgId: string) {
    setForm((f) => ({ ...f, organization_id: orgId, section_id: "" }));
  }

  async function submitForm() {
    setError(null);

    if (!form.section_id) {
      setError("Please select an organization and section.");
      return;
    }
    if (!form.name.trim()) {
      setError("Need name is required.");
      return;
    }
    if (form.quantity_required < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      await createNeed({
        name: form.name.trim(),
        priority: form.priority,
        quantity_required: form.quantity_required,
        unit: form.unit,
        description: form.description.trim(),
        section: parseInt(form.section_id),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setError(
        "Failed to save the need. Please check your inputs and try again.",
      );
    } finally {
      setSubmitting(false);
    }
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

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Slide-in panel from the right */}
      <div className="h-full w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Add Need Manually
            </h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Enter a new need directly into the system
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

        {/* Form body */}
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
              <h3 className="text-xl font-semibold text-gray-900">
                Need Added!
              </h3>
              <p className="text-gray-500 text-sm">
                Redirecting you to All Needs…
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitForm();
              }}
              className="space-y-5"
            >
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization <span className="text-red-500">*</span>
                </label>
                {loadingOrgs ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ) : organizations.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    No organizations found. Please create an organization first.
                  </div>
                ) : (
                  <select
                    value={form.organization_id}
                    onChange={(e) => handleOrgChange(e.target.value)}
                    required
                    title="Organization"
                    aria-label="Organization"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select organization…</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} — {org.district}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Section / Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.section_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, section_id: e.target.value }))
                  }
                  required
                  disabled={!form.organization_id || sections.length === 0}
                  aria-label="Section / Department"
                  title="Section / Department"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!form.organization_id
                      ? "Select an organization first"
                      : sections.length === 0
                        ? "No sections in this organization"
                        : "Select section…"}
                  </option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                      {sec.head_of_section ? ` — ${sec.head_of_section}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="border-gray-100" />

              {/* Need Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Need Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Saline Bottles, Surgical Gloves, Rice Bags…"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
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
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${
                          selected
                            ? `border-current ring-2 ${cfg.ring} bg-gray-50`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
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

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Quantity Required <span className="text-red-500">*</span>
                  </label>
                  <input
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
                    title="Quantity Required"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
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
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    {Object.entries(unitLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Error */}
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

        {/* Footer actions */}
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
              onClick={() => submitForm()}
              disabled={submitting || loadingOrgs}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Need
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
