"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  Organization,
  NeedItem,
  Section,
  getOrganization,
  deleteNeed,
  deleteSection,
} from "@/lib/api";
import SectionAccordion from "@/components/SectionAccordion";
import AddSectionModal from "@/components/AddSectionModal";
import ManualNeedEntryForm from "@/components/ManualNeedEntryForm";
import EditNeedModal from "@/components/EditNeedModal";
import EditSectionModal from "@/components/EditSectionModal";
import { PageLoading } from "@/components/LoadingSpinner";

export default function OrganizationDetailPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "ORG_ADMIN";
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addNeedForSection, setAddNeedForSection] = useState<{
    orgId: number;
    sectionId: number;
  } | null>(null);
  const [editNeed, setEditNeed] = useState<NeedItem | null>(null);
  const [deleteNeedConfirm, setDeleteNeedConfirm] = useState<NeedItem | null>(
    null,
  );
  const [deletingNeed, setDeletingNeed] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      const id = Number(params.id);
      const org = await getOrganization(id);
      setOrganization(org);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchOrganization();
  }, [params.id, fetchOrganization]);

  if (loading) return <PageLoading />;

  if (error || !organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Organization Not Found
          </h3>
          <p className="text-red-600 mb-4">
            {error || "The requested organization does not exist"}
          </p>
          <Link href="/organizations" className="text-blue-600 hover:text-blue-700">
            Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  const totalNeeds =
    organization.sections?.reduce(
      (acc, section) => acc + (section.needs?.length || 0),
      0,
    ) || 0;

  const criticalNeeds =
    organization.sections?.reduce(
      (acc, section) =>
        acc +
        (section.needs?.filter((n) => n.priority === "CRITICAL").length || 0),
      0,
    ) || 0;

  function findNeedById(needId: number): NeedItem | null {
    for (const section of organization?.sections ?? []) {
      const found = section.needs?.find((n) => n.id === needId);
      if (found) return found;
    }
    return null;
  }

  async function handleDeleteNeed(needId: number) {
    setDeletingNeed(true);
    try {
      await deleteNeed(needId);
      setDeleteNeedConfirm(null);
      setLoading(true);
      await fetchOrganization();
    } catch {
      alert("Failed to delete need. Please try again.");
    } finally {
      setDeletingNeed(false);
    }
  }

  async function handleDeleteSection(sectionId: number) {
    try {
      await deleteSection(sectionId);
      setLoading(true);
      await fetchOrganization();
    } catch {
      alert("Failed to delete section. Please try again.");
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm">
          <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
            Organizations
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{organization.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {organization.district}
                  </span>
                  <span className="flex items-center gap-1">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Reg: {organization.registration_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {organization.sections?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Sections</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{totalNeeds}</p>
                <p className="text-sm text-gray-500">Total Needs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{criticalNeeds}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sections & Needs</h2>
            {isAdmin && (
              <button
                onClick={() => setShowAddSection(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Section
              </button>
            )}
          </div>

          {organization.sections && organization.sections.length > 0 ? (
            <div className="space-y-4">
              {organization.sections.map((section, index) => (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  defaultOpen={index === 0}
                  onAddNeed={
                    isAdmin
                      ? () =>
                          setAddNeedForSection({
                            orgId: organization.id,
                            sectionId: section.id,
                          })
                      : undefined
                  }
                  onEditNeed={
                    isAdmin
                      ? (needId) => {
                          const n = findNeedById(needId);
                          if (n) setEditNeed(n);
                        }
                      : undefined
                  }
                  onDeleteNeed={
                    isAdmin
                      ? (needId) => {
                          const n = findNeedById(needId);
                          if (n) setDeleteNeedConfirm(n);
                        }
                      : undefined
                  }
                  onEditSection={isAdmin ? () => setEditSection(section) : undefined}
                  onDeleteSection={
                    isAdmin ? () => handleDeleteSection(section.id) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Sections Yet
              </h3>
              <p className="text-gray-500 mb-4">Add sections to organize your needs</p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Section
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Need Modal */}
      {isAdmin && editNeed && (
        <EditNeedModal
          need={editNeed}
          onClose={() => setEditNeed(null)}
          onSuccess={() => {
            setEditNeed(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Delete Need Confirmation */}
      {isAdmin && deleteNeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600"
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
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Need</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete <strong>&ldquo;{deleteNeedConfirm.name}&rdquo;</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteNeedConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNeed(deleteNeedConfirm.id)}
                disabled={deletingNeed}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {deletingNeed ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {isAdmin && editSection && (
        <EditSectionModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onSuccess={() => {
            setEditSection(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Add Section Modal */}
      {isAdmin && showAddSection && organization && (
        <AddSectionModal
          organizationId={organization.id}
          onClose={() => setShowAddSection(false)}
          onSuccess={() => {
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Add Need Form (pre-filled to specific section) */}
      {isAdmin && addNeedForSection && (
        <ManualNeedEntryForm
          initialOrgId={addNeedForSection.orgId}
          initialSectionId={addNeedForSection.sectionId}
          onClose={() => setAddNeedForSection(null)}
          onSuccess={() => {
            setAddNeedForSection(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}
    </>
  );
}
