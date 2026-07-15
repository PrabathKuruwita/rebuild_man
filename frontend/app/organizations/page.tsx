"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  Organization,
  getOrganizations,
  deleteOrganization,
  NeedItem,
  Section,
  deleteNeed,
  deleteSection,
} from "@/lib/api";
import { PageLoading } from "@/components/LoadingSpinner";
import { useAdminGuard } from "@/lib/useAuthGuard";
import { useAuth } from "@/lib/AuthContext";
import SectionAccordion from "@/components/SectionAccordion";
import AddSectionModal from "@/components/AddSectionModal";
import ManualNeedEntryForm from "@/components/ManualNeedEntryForm";
import EditNeedModal from "@/components/EditNeedModal";
import EditSectionModal from "@/components/EditSectionModal";
import { useSearchParams } from "next/navigation";
import { Search, Filter, ChevronDown, X } from "lucide-react";

function OrganizationsContent() {
  const { authorized, isLoading: authLoading } = useAdminGuard();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const targetSectionId = sectionParam ? Number(sectionParam) : null;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [isOrgExpanded, setIsOrgExpanded] = useState(true);
  const [deleteSectionConfirm, setDeleteSectionConfirm] =
    useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);
  const [editSectionConfirm, setEditSectionConfirm] = useState<Section | null>(
    null,
  );
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("");

  const fetchOrganizations = async () => {
    try {
      const orgs = await getOrganizations();
      setOrganizations(orgs);

      // If ADMIN, show all organizations; if ORG_ADMIN, show only their organization
      if (user?.role === "ADMIN") {
        // ADMIN sees all organizations - stay in list view by default
      } else if (user?.role === "ORG_ADMIN") {
        // ORG_ADMIN sees only their organization
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          setSelectedOrgId(orgs[0].id);
        }
      }
    } catch {
      setOrganizations([]);
      setOrganization(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!authorized) return;
      setLoading(true);
      await fetchOrganizations();
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  useEffect(() => {
    if (!loading && targetSectionId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`section-${targetSectionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, targetSectionId]);

  const isProfileTab = searchParams.get("profile") === "true";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isProfileTab) {
      if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const handleHashScroll = () => {
      if (window.location.hash === "#sections-needs") {
        const element = document.getElementById("sections-needs");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    if (!loading) {
      const timer = setTimeout(handleHashScroll, 150);
      window.addEventListener("hashchange", handleHashScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("hashchange", handleHashScroll);
      };
    }
  }, [loading, isProfileTab]);

  const findNeedById = (needId: number): NeedItem | null => {
    if (!organization?.sections) return null;
    for (const section of organization.sections) {
      const found = section.needs?.find((n) => n.id === needId);
      if (found) return found;
    }
    return null;
  };

  async function handleDeleteNeed(needId: number) {
    setDeletingNeed(true);
    try {
      await deleteNeed(needId);
      setDeleteNeedConfirm(null);
      setLoading(true);
      await fetchOrganizations();
      setLoading(false);
    } catch {
      alert("Failed to delete need. Please try again.");
    } finally {
      setDeletingNeed(false);
    }
  }

  async function confirmDeleteSection() {
    if (!deleteSectionConfirm) return;
    setDeletingSection(true);
    try {
      await deleteSection(deleteSectionConfirm.id);
      setDeleteSectionConfirm(null);
      setLoading(true);
      await fetchOrganizations();
      setLoading(false);
    } catch {
      alert("Failed to delete section. Please try again.");
      setDeletingSection(false);
    }
  }

  async function confirmEditSection() {
    if (!editSectionConfirm) return;
    setEditSection(editSectionConfirm);
    setEditSectionConfirm(null);
  }

  const handleSwitchOrganization = (orgId: number) => {
    setSelectedOrgId(orgId);
    const selected = organizations.find((o) => o.id === orgId);
    setOrganization(selected || null);
  };

  const handleDelete = async () => {
    const targetOrg = user?.role === "ADMIN" ? orgToDelete : organization;
    if (!targetOrg) return;
    setDeleting(true);
    try {
      await deleteOrganization(targetOrg.id);
      if (user?.role === "ADMIN") {
        setOrgToDelete(null);
      } else {
        setOrganization(null);
      }
      setShowDeleteConfirm(false);
      await fetchOrganizations();
    } catch (err) {
      console.error("Failed to delete organization:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Filter out fulfilled needs from sections for display
  const sectionsWithUnfulfilledNeeds =
    organization?.sections?.map((section) => ({
      ...section,
      needs:
        section.needs?.filter(
          (need) => need.quantity_confirmed < need.quantity_required,
        ) || [],
    })) || [];

  const orgTypes = [
    "Hospital",
    "Clinic",
    "School",
    "NGO",
    "Charity",
    "Government",
    "Other"
  ];

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = orgTypeFilter
      ? org.org_type?.toLowerCase() === orgTypeFilter.toLowerCase()
      : true;
    return matchesSearch && matchesType;
  });

  if (authLoading || !authorized || loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 border-b border-slate-100 pb-5">
        <div className="flex-1">
          <h1 className="page-title">
            {user?.role === "ADMIN" ? "Organizations" : "Organization"}
          </h1>
          <p className="page-subtitle">
            {user?.role === "ADMIN"
              ? `View all organizations (Total: ${organizations.length})`
              : "View and manage the organization"}
          </p>
        </div>

        {/* Action Buttons - Only for ORG_ADMIN now, ADMIN has buttons on cards */}
        {organization && user?.role === "ORG_ADMIN" && (
          <div className="flex items-center gap-3">
            <Link
              href={`/organizations/${organization.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              Edit Organization
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
              Delete Organization
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {user?.role === "ADMIN" && !organization ? (
        <div className="space-y-8">
          {/* Search & Filter Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all duration-300 hover:shadow-md">
            <div className="search-bar-container">
              <Search className="search-bar-icon" />
              <input
                type="text"
                placeholder="Search by name or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Filter size={18} />
              </span>
              <select
                value={orgTypeFilter}
                onChange={(e) => setOrgTypeFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all duration-200"
              >
                <option value="">All Organization Types</option>
                {orgTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <ChevronDown size={18} />
              </span>
            </div>
          </div>

          {filteredOrgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                        <h2 className="font-bold text-gray-900 line-clamp-1">
                          {org.name}
                        </h2>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                          {org.org_type}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Reg:</span>
                        <span className="text-gray-900 font-medium">
                          {org.registration_number}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">District:</span>
                        <span className="text-gray-900 font-medium">
                          {org.district}
                        </span>
                      </div>
                      {org.phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Phone:</span>
                          <span className="text-gray-900">{org.phone}</span>
                        </div>
                      )}
                      {org.email_contact && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-900 truncate ml-2">
                            {org.email_contact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrganization(org)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setOrgToDelete(org);
                        setShowDeleteConfirm(true);
                      }}
                      className="inline-flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Organization"
                    >
                      <svg
                        className="w-5 h-5"
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-xs">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Organizations</h3>
              <p className="text-sm text-slate-500">
                No organizations match your current search or type filtering criteria.
              </p>
            </div>
          )}
        </div>
      ) : organization ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 transition-all">
          {user?.role === "ADMIN" && (
            <button
              onClick={() => setOrganization(null)}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Organizations List
            </button>
          )}
          {/* Header with Icon and Basic Info */}
          <div className="flex items-start gap-4 mb-6 justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-blue-600"
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
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {organization.name}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {organization.org_type && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {organization.org_type}
                    </span>
                  )}
                  {organization.established_year && (
                    <span className="text-sm text-gray-500">
                      Est: {organization.established_year}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title={isOrgExpanded ? "Minimize" : "Expand"}
              >
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isOrgExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Core Information Grid - Collapsible */}
          {isOrgExpanded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                {/* Registration & Location */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Registration
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {organization.registration_number}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    District
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {organization.district}
                  </p>
                </div>

                {/* Address */}
                {organization.address && (
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Address
                    </h3>
                    <p className="text-gray-900">{organization.address}</p>
                  </div>
                )}
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
                {organization.phone && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Phone
                    </h3>
                    <a
                      href={`tel:${organization.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {organization.phone}
                    </a>
                  </div>
                )}
                {organization.email_contact && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Email
                    </h3>
                    <a
                      href={`mailto:${organization.email_contact}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {organization.email_contact}
                    </a>
                  </div>
                )}
                {organization.website && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Website
                    </h3>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 font-medium truncate"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              {organization.description && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {organization.description}
                  </p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {organization.sections?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Sections</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {sectionsWithUnfulfilledNeeds?.reduce(
                      (a, s) => a + (s.needs?.length || 0),
                      0,
                    ) || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Needs</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {sectionsWithUnfulfilledNeeds?.reduce(
                      (a, s) =>
                        a +
                        (s.needs?.filter((n) => n.priority === "CRITICAL")
                          .length || 0),
                      0,
                    ) || 0}
                  </p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
              </div>
            </>
          )}

          {/* Sections & Needs */}
          <div id="sections-needs" className="mt-8 pt-8 border-t border-gray-100 scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Sections & Needs
              </h2>
              {user?.role === "ORG_ADMIN" && (
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
                {sectionsWithUnfulfilledNeeds.map((section, index) => (
                  <div id={`section-${section.id}`} key={section.id} className="scroll-mt-6">
                    <SectionAccordion
                      section={section}
                      defaultOpen={targetSectionId ? section.id === targetSectionId : index === 0}
                      onAddNeed={
                        user?.role === "ORG_ADMIN"
                          ? () =>
                              setAddNeedForSection({
                                orgId: organization.id,
                                sectionId: section.id,
                              })
                          : undefined
                      }
                      onEditNeed={
                        user?.role === "ORG_ADMIN"
                          ? (needId) => {
                              const n = findNeedById(needId);
                              if (n) setEditNeed(n);
                            }
                          : undefined
                      }
                      onDeleteNeed={
                        user?.role === "ORG_ADMIN"
                          ? (needId) => {
                              const n = findNeedById(needId);
                              if (n) setDeleteNeedConfirm(n);
                            }
                          : undefined
                      }
                      onEditSection={
                        user?.role === "ORG_ADMIN"
                          ? () => setEditSectionConfirm(section)
                          : undefined
                      }
                      onDeleteSection={
                        user?.role === "ORG_ADMIN"
                          ? async () => {
                              setDeleteSectionConfirm(section);
                            }
                          : undefined
                      }
                    />
                  </div>
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
                {(user?.role === "ADMIN" || user?.role === "ORG_ADMIN") && (
                  <p className="text-gray-500">
                    No sections have been added to this organization yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : user?.role === "ORG_ADMIN" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Organization Yet
          </h3>
          <p className="text-gray-500 mb-6">
            No organization has been registered in the system.
          </p>
          <Link
            href="/organizations/new"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            Add Organization
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Organizations
          </h3>
          <p className="text-gray-500">View all organizations in the system.</p>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSection && organization && (
        <AddSectionModal
          organizationId={organization.id}
          onClose={() => setShowAddSection(false)}
          onSuccess={() => {
            setShowAddSection(false);
            setLoading(true);
            fetchOrganizations();
          }}
        />
      )}

      {/* Manual Need Entry Form (for adding needs) */}
      {addNeedForSection && organization && (
        <ManualNeedEntryForm
          initialOrgId={organization.id}
          initialSectionId={addNeedForSection.sectionId}
          onClose={() => setAddNeedForSection(null)}
          onSuccess={() => {
            setAddNeedForSection(null);
            setLoading(true);
            fetchOrganizations();
          }}
        />
      )}

      {/* Edit Need Modal */}
      {editNeed && (
        <EditNeedModal
          need={editNeed}
          onClose={() => setEditNeed(null)}
          onSuccess={() => {
            setEditNeed(null);
            setLoading(true);
            fetchOrganizations();
          }}
        />
      )}

      {/* Delete Need Confirmation */}
      {deleteNeedConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setDeleteNeedConfirm(null)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Need
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;
                <strong>{deleteNeedConfirm.name}</strong>&quot;?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteNeedConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNeed(deleteNeedConfirm.id)}
                  disabled={deletingNeed}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingNeed ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editSection && organization && (
        <EditSectionModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onSuccess={() => {
            setEditSection(null);
            setLoading(true);
            fetchOrganizations();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>
                  {(user?.role === "ADMIN" ? orgToDelete : organization)?.name}
                </strong>
                ? All sections and needs will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Confirmation Modal */}
      {deleteSectionConfirm && (
        <div className="fixed inset-0 z-[1100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setDeleteSectionConfirm(null)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Section
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>{deleteSectionConfirm.name}</strong>? All needs in this
                section will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteSectionConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSection}
                  disabled={deletingSection}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingSection ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Confirmation Modal */}
      {editSectionConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setEditSectionConfirm(null)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Section
                  </h3>
                  <p className="text-sm text-gray-500">
                    Modify section details
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Edit the section <strong>{editSectionConfirm.name}</strong>? You
                will be able to update the section name and other details.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditSectionConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEditSection}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <OrganizationsContent />
    </Suspense>
  );
}
