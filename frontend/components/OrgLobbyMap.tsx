import React from "react";
import { Organization, NeedItem, Donation, Section } from "@/lib/api";
import { Building2, Layers, CheckCircle2, Flame, PlayCircle, ClipboardList, Users, AlertTriangle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedCounter, AnimatedProgressBar, RevealItem } from "./animations";

interface OrgLobbyMapProps {
  organization: Organization;
  needs: NeedItem[];
  donations?: Donation[];
}

export default function OrgLobbyMap({ organization, needs, donations = [] }: OrgLobbyMapProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const sectionsList = organization.sections || [];

  // Filter sections by name or head of section name
  const filteredSections = sectionsList.filter(
    (sec) =>
      sec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sec.head_of_section &&
        sec.head_of_section.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper to calculate physically received quantity from fulfilled donations
  const getNeedPhysicallyReceived = (needId: number) => {
    return donations
      .filter((d) => d.need_item === needId && d.status === "FULFILLED")
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  // Calculate Organization-wide global metrics
  const totalOrgRequired = needs.reduce((sum, n) => sum + n.quantity_required, 0);
  const totalOrgReceived = needs.reduce((sum, n) => sum + getNeedPhysicallyReceived(n.id), 0);
  const overallProgress = totalOrgRequired > 0 ? Math.round((totalOrgReceived / totalOrgRequired) * 100) : 0;

  // Active donations: status confirmed or fulfilled
  const activeDonations = donations.filter((d) => d.status === "CONFIRMED" || d.status === "FULFILLED");
  // Unique donors based on donor field, fallback to name or government dept
  const uniqueDonors = new Set(
    activeDonations
      .map((d) => d.donor || d.donor_name || d.government_department)
      .filter(Boolean)
  );
  const totalActiveDonors = uniqueDonors.size;
  const totalSections = sectionsList.length;

  const renderSectionCard = (sec: Section, idx: number) => {
    const sectionNeeds = needs.filter((n) => n.section === sec.id);
    const totalCreated = sectionNeeds.length;
    const fulfilled = sectionNeeds.filter(
      (n) => n.quantity_received >= n.quantity_required && n.quantity_required > 0
    ).length;
    const fulfilling = sectionNeeds.filter(
      (n) =>
        n.quantity_received > 0 &&
        n.quantity_received < n.quantity_required
    ).length;
    const notStarted = sectionNeeds.filter(
      (n) => n.quantity_received === 0 && n.quantity_required > 0
    ).length;

    // Fulfillment progress math
    const sectionRequiredQty = sectionNeeds.reduce((sum, n) => sum + n.quantity_required, 0);
    const sectionReceivedQty = sectionNeeds.reduce((sum, n) => sum + getNeedPhysicallyReceived(n.id), 0);
    const sectionProgress = sectionRequiredQty > 0 ? Math.round((sectionReceivedQty / sectionRequiredQty) * 100) : 0;

    // Critical alert check
    const hasCritical = sectionNeeds.some(
      (n) => n.priority === "CRITICAL" && n.quantity_received < n.quantity_required
    );

    // Pending donations count
    const pendingDonationsCount = donations.filter(
      (d) => d.status === "PENDING" && sectionNeeds.some((n) => n.id === d.need_item)
    ).length;

    const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      router.push(`/organizations?section=${sec.id}`);
    };

    return (
      <RevealItem
        key={sec.id}
        index={idx}
        staggerDelay={0.08}
        className="flex flex-col items-center w-full"
      >
        {/* Card container */}
        <div
          onClick={handleCardClick}
          className="h-full w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          {/* Section Header Top Area */}
          <div>
            {/* Title & Icon Row */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-bold text-slate-800 text-sm leading-snug truncate" title={sec.name}>
                  {sec.name}
                </h5>
                <p className="text-[11px] text-slate-400 font-medium truncate" title={sec.head_of_section ? `Head: ${sec.head_of_section}` : "Section Department"}>
                  {sec.head_of_section ? `Head: ${sec.head_of_section}` : "Section Department"}
                </p>
              </div>
            </div>

            {/* Status Badges Row - Dedicated row with consistent min-height for uniform baseline across all cards */}
            <div className="flex items-center gap-1.5 min-h-[26px] mb-3">
              {hasCritical && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs animate-pulse"
                  title="Critical Needs Unfulfilled"
                >
                  <AlertTriangle size={10} className="shrink-0 text-rose-600" />
                  Urgent
                </span>
              )}
              {pendingDonationsCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs"
                  title={`${pendingDonationsCount} donation(s) pending confirmation`}
                >
                  <Clock size={10} className="shrink-0 text-amber-600" />
                  {pendingDonationsCount} Pending
                </span>
              )}
              {!hasCritical && pendingDonationsCount === 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/40 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={10} className="shrink-0 text-emerald-500" />
                  All Clear
                </span>
              )}
            </div>
          </div>

          {/* Need Stats Panel */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            {/* 1. Created Needs */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <ClipboardList size={13} className="text-slate-400" />
                Created Needs
              </span>
              <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 font-bold rounded">
                <AnimatedCounter value={totalCreated} />
              </span>
            </div>

            {/* 2. Fulfilled (100%) */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                100% Fulfilled
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                <AnimatedCounter value={fulfilled} />
              </span>
            </div>

            {/* 3. Fulfilling (In progress) */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500 animate-pulse" />
                In Progress Fulfilling
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">
                <AnimatedCounter value={fulfilling} />
              </span>
            </div>

            {/* 4. Not Started */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <PlayCircle size={13} className="text-slate-400" />
                Not Fulfilled Yet
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded">
                <AnimatedCounter value={notStarted} />
              </span>
            </div>

            {/* 5. Fulfillment Progress Bar */}
            <div className="mt-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 font-semibold">
                <span>Fulfillment Progress</span>
                <span><AnimatedCounter value={sectionProgress} suffix="%" /></span>
              </div>
              <AnimatedProgressBar
                percentage={sectionProgress}
                duration={800}
                delay={idx * 60}
                containerClassName="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative"
                barClassName={`h-full rounded-full ${
                  sectionProgress >= 100
                    ? "bg-emerald-500"
                    : sectionProgress >= 50
                      ? "bg-blue-500"
                      : sectionProgress > 0
                        ? "bg-amber-500"
                        : "bg-slate-300"
                }`}
                showShimmer={true}
              />
            </div>

            {/* Direct Action Buttons */}
            <div className="mt-3 pt-3 border-t border-slate-200/50 flex gap-2">
              <Link
                href={`/organizations?section=${sec.id}`}
                className="flex-1 text-center py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Manage Needs
              </Link>
              <Link
                href={`/admin/donations?section=${sec.id}`}
                className="flex-1 text-center py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Track Pledges
              </Link>
            </div>
          </div>
        </div>
      </RevealItem>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden mb-12 animate-in fade-in duration-500">
      {/* Inline styles for lobby animations, scrollbars and progress fills */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes lobbyFadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes lobbyFadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes lobbyGrowHeight {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes lobbyProgressFill {
          from {
            width: 0;
          }
        }
        @keyframes lobbyShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .lobby-animate-parent {
          animation: lobbyFadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lobby-animate-child {
          animation: lobbyFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .lobby-animate-line-y {
          animation: lobbyGrowHeight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
          transform: scaleY(0);
        }
        .lobby-animate-progress {
          animation: lobbyProgressFill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: left;
        }
        .lobby-progress-shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: lobbyShimmer 2.2s infinite linear;
        }
        .lobby-scrollable-container::-webkit-scrollbar {
          width: 6px;
        }
        .lobby-scrollable-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .lobby-scrollable-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .lobby-scrollable-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            <Building2 className="text-blue-600" size={22} />
            Organization Lobby Map
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Interactive bird&apos;s-eye view of sections and real-time need fulfillment
          </p>
        </div>

        {/* Search Control */}
        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
          {/* Search Input */}
          <div className="relative w-60">
            <input
              id="map-section-search"
              name="section_search"
              autoComplete="off"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search section..."
              aria-label="Search section"
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Clear Search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diagram container with suitable max-height and custom vertical scrollbar */}
      <div className="flex flex-col items-center py-6 w-full max-h-[580px] overflow-y-auto overflow-x-hidden pr-2 lobby-scrollable-container">
        {/* Parent Box: Organization */}
        <div className="relative group flex flex-col items-center lobby-animate-parent">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md w-80 text-center transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-indigo-600/20 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} />
            </div>
            <h4 className="font-extrabold text-base tracking-tight mb-1">
              {organization.name}
            </h4>
            <span className="inline-block text-[10px] px-2 py-0.5 bg-white/15 rounded-full font-semibold uppercase tracking-wider mb-4">
              {organization.org_type || "Institution"}
            </span>

            {/* Overall Progress Bar */}
            <div className="mb-4 text-left">
              <div className="flex justify-between items-center text-[10px] text-indigo-200 mb-1 font-semibold">
                <span>Overall Need Fulfilling</span>
                <span><AnimatedCounter value={overallProgress} suffix="%" /></span>
              </div>
              <AnimatedProgressBar
                percentage={overallProgress}
                duration={900}
                containerClassName="w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative"
                barClassName="h-full bg-white rounded-full"
                showShimmer={true}
              />
            </div>

            {/* Key Global Stats */}
            <div className="flex justify-around items-center pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-100" title="Total Sections">
                <Layers size={13} className="text-indigo-200" />
                <span className="font-bold text-white"><AnimatedCounter value={totalSections} /></span>
                <span className="text-[10px] text-indigo-200/80">Sections</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-indigo-100" title="Total Needs">
                <ClipboardList size={13} className="text-indigo-200" />
                <span className="font-bold text-white"><AnimatedCounter value={needs.length} /></span>
                <span className="text-[10px] text-indigo-200/80">Needs</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-indigo-100" title="Active Donors">
                <Users size={13} className="text-indigo-200" />
                <span className="font-bold text-white"><AnimatedCounter value={totalActiveDonors} /></span>
                <span className="text-[10px] text-indigo-200/80">Active Donors</span>
              </div>
            </div>
          </div>

          {/* Vertical stem down from parent */}
          {filteredSections.length > 0 && (
            <div
              className="w-px h-8 bg-slate-300 lobby-animate-line-y"
              style={{ animationDelay: "0.3s" }}
            />
          )}
        </div>

        {filteredSections.length > 0 ? (
          /* Grid View: Responsive wrapping cards without vertical connector stems */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full px-6 mt-8 min-w-0">
            {filteredSections.map((sec, idx) => renderSectionCard(sec, idx))}
          </div>
        ) : (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 mx-6 mt-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <h4 className="font-heading font-bold text-slate-800 text-base mb-1">
              {sectionsList.length > 0 ? "No Matching Sections" : "No Sections Registered"}
            </h4>
            <p className="font-body text-xs sm:text-sm text-slate-500 max-w-sm">
              {sectionsList.length > 0
                ? "No sections match your current search criteria. Try clearing the search."
                : "No department sections have been registered yet for this organization."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
