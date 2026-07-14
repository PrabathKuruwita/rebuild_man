"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Organization, getOrganizations, NeedItem, getNeeds, SystemStats, getSystemStats, getPublicRecentDonations, PublicDonation } from "@/lib/api";
import { PageLoading } from "@/components/LoadingSpinner";
import AdvancedSriLankaMap from "@/components/AdvancedSriLankaMap";
import { useAuth } from "@/lib/AuthContext";
import DonorDashboard from "@/components/DonorDashboard";



export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [urgentNeed, setUrgentNeed] = useState<NeedItem | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<PublicDonation[]>([]);
  const [stories, setStories] = useState<{ title: string; body: string; progress: number }[]>([]);
  const { user, loading: authLoading } = useAuth();

  const fetchData = async () => {
    try {
      const [orgs, allNeeds, systemStats, donations] = await Promise.all([
        getOrganizations(),
        getNeeds(),
        getSystemStats(),
        getPublicRecentDonations().catch((err) => {
          console.warn("Failed to fetch public donations", err);
          return [] as PublicDonation[];
        })
      ]);
      setOrganizations(orgs);
      setStats(systemStats);
      setRecentDonations(donations || []);

      // Filter and sort for the hero's urgent need
      const urgentNeeds = allNeeds.filter(
        (n) => n.priority === "CRITICAL" && n.quantity_confirmed < n.quantity_required
      );
      if (urgentNeeds.length > 0) {
        const sortedNeeds = urgentNeeds.sort(
          (a, b) =>
            b.quantity_required -
            b.quantity_confirmed -
            (a.quantity_required - a.quantity_confirmed),
        );
        setUrgentNeed(sortedNeeds[0]);
      }

      // Compute success story needs
      const topNeeds = allNeeds
        .filter((n) => n.quantity_required > 0)
        .map((n) => ({
          name: n.name,
          progress: Math.min(
            100,
            Math.round((n.quantity_received / n.quantity_required) * 100),
          ),
          orgName: n.section_detail?.organization_name || "the community",
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 3);

      const storiesList = topNeeds.map((item, index) => ({
        title: `Success Story ${index + 1}`,
        body: `${item.name} for ${item.orgName} reached ${item.progress}% coverage through community and institutional donations.`,
        progress: item.progress,
      }));

      if (storiesList.length === 0) {
        storiesList.push({
          title: "Building Momentum",
          body: "The platform is collecting the first wave of support and preparing measurable success stories.",
          progress: 0,
        });
      }
      setStories(storiesList);
    } catch (err) {
      console.warn(
        "Backend API not available. Start with: python manage.py runserver",
        err instanceof Error ? err.message : "Failed to load data",
      );
      // Continue without backend data - allow UI testing
      setOrganizations([]);
      setStats(null);
      setRecentDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await fetchData();
    }
    loadData();
  }, []);

  if (loading || authLoading) return <PageLoading />;

  if (user?.role === "DONOR") {
    return <DonorDashboard />;
  }

  // Calculate real stats or use fallbacks from screenshot
  const provinces = stats ? stats.provinces_covered : 9;
  const totalOrgs = stats ? stats.verified_hospitals : (organizations.length || 120);
  const donorsOnboarded = stats ? stats.donors_onboarded.toLocaleString() : "4,500+";
  const deliverySuccess = stats ? `${stats.delivery_success_rate}%` : "98%";


  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative bg-blue-900 overflow-hidden pt-16 lg:pt-24 pb-0 flex flex-col justify-between min-h-[650px]">
        {/* Full-bleed Background Image covering the entire blue section */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1920&q=80"
            alt="Hospital Donation Background"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay for text readability and theme matching */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/85 to-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-blue-950/45"></div>
          {/* Dot Pattern Overlay */}
          <div className="absolute inset-0 bg-dots opacity-40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-grow flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4">
            {/* Left Column: Text Content */}
            <div className="space-y-8 animate-fade-in-up relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live across Sri Lanka • Verified organizations
                </span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                Donate directly to <br />
                <span className="text-green-400">organizations</span> that need
                it most.
              </h1>

              <p className="text-sm lg:text-base text-blue-100/80 leading-relaxed max-w-lg">
                NeedTracker connects generous donors with verified organizations
                across Sri Lanka. Browse real, urgent needs, and contribute in
                minutes.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/needs"
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-1"
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
                      d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"
                    />
                  </svg>
                  Donate Now
                </Link>
                <Link
                  href="/login?tab=org-admin"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg border border-white/30 backdrop-blur-md transition-all flex items-center gap-2"
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Register Your Organization
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>

              <div className="flex items-center gap-2 text-blue-100/70 text-sm font-medium">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.397 9.126-6 11.773-3.603-2.647-6-6.827-6-11.773 0-.68.056-1.35.166-2.001zm8.354 1.313a1 1 0 00-1.414 1.414L11.586 10l-2.474 2.474a1 1 0 101.414 1.414L13 11.414l2.474 2.474a1 1 0 001.414-1.414L14.414 10l2.474-2.474a1 1 0 00-1.414-1.414L13 8.586l-2.48-2.274z"
                    clipRule="evenodd"
                  />
                </svg>
                100% transparent - Every donation tracked end-to-end
              </div>

            </div>
            {/* Right Column: Live Activity Feed (stacked vertically, right-aligned, hover effects, web-suitable font sizes) */}
            <div className="relative z-20 flex flex-col justify-center h-full lg:pl-24 space-y-10 w-full">
              {/* Realtime Urgent Needs Section (Above Completed Donations) */}
              {urgentNeed && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-widest">
                      Most Urgent Right Now
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="text-base md:text-lg font-bold text-white leading-snug">
                      {urgentNeed.name}
                    </h4>
                    <span className="text-xs md:text-sm text-slate-300 font-medium">
                      {urgentNeed.section_detail?.organization_name || "Colombo South Teaching Hospital"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, Math.round((urgentNeed.quantity_confirmed / urgentNeed.quantity_required) * 100))}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>{urgentNeed.quantity_confirmed} of {urgentNeed.quantity_required} units pledged</span>
                      <span className="text-green-400 font-bold">
                        {Math.min(100, Math.round((urgentNeed.quantity_confirmed / urgentNeed.quantity_required) * 100))}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Donations Section (Below Realtime Urgent Needs) */}
              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs md:text-sm font-bold text-green-400 uppercase tracking-widest">
                    Live Feed • Recent Contributions
                  </span>
                </div>

                {recentDonations.length > 0 ? (
                  <div className="w-full overflow-hidden py-1 relative marquee-mask">
                    <div className="flex overflow-hidden">
                      <div className="animate-marquee flex w-max items-center whitespace-nowrap gap-8">
                        {/* Original Items */}
                        {recentDonations.map((donation, idx) => (
                          <div
                            key={`orig-${donation.id}-${idx}`}
                            className="flex items-center gap-1.5 text-base md:text-lg text-slate-200 cursor-pointer hover:text-green-400 hover:scale-105 transition-all duration-200 hover:bg-white/5 px-2 py-1 rounded-md"
                          >
                            <span className="font-bold text-white">{donation.donor_name}</span>
                            <span className="text-slate-400">contributed</span>
                            <span className="font-bold text-green-400">
                              {donation.quantity} {donation.unit.toLowerCase()}s of {donation.need_item_name}
                            </span>
                            <span className="text-slate-400">to</span>
                            <span className="font-bold text-white">{donation.organization_name}</span>
                          </div>
                        ))}

                        {/* Duplicated Items */}
                        {recentDonations.map((donation, idx) => (
                          <div
                            key={`dup-${donation.id}-${idx}`}
                            className="flex items-center gap-1.5 text-base md:text-lg text-slate-200 cursor-pointer hover:text-green-400 hover:scale-105 transition-all duration-200 hover:bg-white/5 px-2 py-1 rounded-md"
                          >
                            <span className="font-bold text-white">{donation.donor_name}</span>
                            <span className="text-slate-400">contributed</span>
                            <span className="font-bold text-green-400">
                              {donation.quantity} {donation.unit.toLowerCase()}s of {donation.need_item_name}
                            </span>
                            <span className="text-slate-400">to</span>
                            <span className="font-bold text-white">{donation.organization_name}</span>
                          </div>
                        ))}

                        {/* Triplicated Items */}
                        {recentDonations.length < 5 && recentDonations.map((donation, idx) => (
                          <div
                            key={`trip-${donation.id}-${idx}`}
                            className="flex items-center gap-1.5 text-base md:text-lg text-slate-200 cursor-pointer hover:text-green-400 hover:scale-105 transition-all duration-200 hover:bg-white/5 px-2 py-1 rounded-md"
                          >
                            <span className="font-bold text-white">{donation.donor_name}</span>
                            <span className="text-slate-400">contributed</span>
                            <span className="font-bold text-green-400">
                              {donation.quantity} {donation.unit.toLowerCase()}s of {donation.need_item_name}
                            </span>
                            <span className="text-slate-400">to</span>
                            <span className="font-bold text-white">{donation.organization_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic py-1">
                    Waiting for contributions...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row - Integrated into hero with subtle z-index overlay */}
        <div className="w-full bg-white/10 backdrop-blur-sm border-t border-white/10 relative z-20 overflow-hidden mt-12">
          <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{provinces}</div>
                <div className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  Provinces covered
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {totalOrgs}
                </div>
                <div className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  Verified organizations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {donorsOnboarded}
                </div>
                <div className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  Donors onboarded
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {deliverySuccess}
                </div>
                <div className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  Delivery success
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative">
        <div className="absolute inset-0 bg-dots-dark opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-3 mb-16">
            <div className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">
              How it works
            </div>
            <h2 className="text-3xl font-black text-slate-900">
              Helping organizations in three simple steps
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              A transparent platform built for donors, and organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "1. Browse Verified Needs",
                desc: "Organizations post real-time requests for needs.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                ),
              },
              {
                title: "2. Choose & Donate",
                desc: "Pick a cause that matters to you and donate items or funds securely.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"
                    />
                  </svg>
                ),
              },
              {
                title: "3. Track Your Impact",
                desc: "Follow your donation from confirmation to delivery at the organization.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <div className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">
              Success Highlighted
            </div>
            <h2 className="text-3xl font-black text-slate-900">
              Our Latest Donation Success Stories
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              A snapshot of organizational needs that reached high coverage thanks to our active donor community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <div
                key={story.title}
                className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:bg-white transition-all duration-500 group animate-fade-in"
              >
                <span className="inline-block px-3 py-1 bg-amber-50 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-6">
                  {story.title}
                </span>
                <p className="text-sm leading-relaxed text-slate-600 min-h-[80px]">
                  {story.body}
                </p>
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Fulfillment progress
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {story.progress}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${story.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Donor CTA */}
            <div className="bg-blue-900 rounded-[40px] p-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-dots opacity-50"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white">
                  I want to donate
                </h2>
                <p className="text-blue-100/70 text-base leading-relaxed">
                  Create a free donor account and start contributing to verified
                  organization needs today.
                </p>
                <Link
                  href="/login?tab=register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-all transform hover:translate-x-2"
                >
                  Register as Donor
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Hospital CTA */}
            <div className="bg-white border border-slate-100 rounded-[40px] p-12 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all">
              <div className="absolute inset-0 bg-dots-dark opacity-5"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <svg
                    className="w-6 h-6"
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
                <h2 className="text-3xl font-bold text-slate-900">
                  We&apos;re an organization
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Join NeedTracker to publish your needs, manage donations and
                  reach donors nationwide.
                </p>
                <Link
                  href="/login?tab=org-admin"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-blue-600 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-all transform hover:translate-x-2"
                >
                  Register Your Organization
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Coverage Map */}
      <section id="impact" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
            <div className="max-w-2xl">
              <div className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-3">
                Live Network
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                Support Coverage Across Sri Lanka
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our interactive network shows real-time organizational activity.
                Click on any location to view specific organization requirements
                and local impact.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-xl">
                <div className="text-xl font-bold text-blue-600">{provinces}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Provinces
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-xl">
                <div className="text-xl font-bold text-green-600">
                  {totalOrgs}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Organizations
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-[600px] w-full rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl">
            <AdvancedSriLankaMap organizations={organizations} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[20px] font-black">
                N
              </div>
              <span className="text-slate-300 font-bold text-lg">
                NeedTracker — Sri Lanka
              </span>
            </div>

            <p className="text-slate-500 text-sm order-3 md:order-2">
              © 2026 NeedTracker. Connecting organizations with donors.
            </p>

            <nav className="flex items-center gap-6 order-5 md:order-3">
              <Link
                href="/about"
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
