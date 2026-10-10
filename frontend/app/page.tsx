"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Organization, getOrganizations, NeedItem, getNeeds, SystemStats, getSystemStats, getPublicRecentDonations, PublicDonation } from "@/lib/api";
import { PageLoading } from "@/components/LoadingSpinner";
import AdvancedSriLankaMap from "@/components/AdvancedSriLankaMap";
import { useAuth } from "@/lib/AuthContext";
import DonorDashboard from "@/components/DonorDashboard";
import AnimatedStat from "@/components/AnimatedStat";
import AnalyticsLineChart from "@/components/AnalyticsLineChart";
import { ShieldCheck, Eye, Activity, Heart, Building, CheckCircle2, HandHeart, CheckCircle, Navigation, ArrowRight, Shield } from "lucide-react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

interface SuccessStory {
  id?: number;
  title: string;
  name: string;
  orgName: string;
  progress: number;
}

export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [urgentNeed, setUrgentNeed] = useState<NeedItem | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<PublicDonation[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [statsVisible, setStatsVisible] = useState(false);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const statsSectionRef = useRef<HTMLElement | null>(null);
  const storiesSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (loading) return;
    const node = statsSectionRef.current;
    if (!node) return;

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setStatsVisible(true);
              observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    } else {
      const handleScroll = () => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0) {
          setStatsVisible(true);
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const node = storiesSectionRef.current;
    if (!node) return;

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setStoriesVisible(true);
              observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    } else {
      const handleScroll = () => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0) {
          setStoriesVisible(true);
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [loading]);
  
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const heroContents = [
    {
      prefix: "The trusted platform to donate directly to ",
      highlight: "Organizations",
      suffix: " that need it most.",
      subtext: "Parithyaga connects generous donors with verified organizations across Sri Lanka. Browse real, urgent needs, and contribute in minutes."
    },
    {
      prefix: "Empowering verified ",
      highlight: "Organizations",
      suffix: " to reach generous donors.",
      subtext: "We ensure transparency at every step. See exactly where your contributions go and the direct impact they make in communities."
    },
    {
      prefix: "Join a community making ",
      highlight: "real impact",
      suffix: " where it matters most.",
      subtext: "From critical needs supplies to community rebuilding, your donations provide immediate relief to those who desperately need it."
    },
    {
      prefix: "Transforming urgent community needs into ",
      highlight: "fulfilled promises",
      suffix: ", together.",
      subtext: "Our verified network guarantees that your help reaches the right hands. Start your journey of giving and transform lives today."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentContentIndex((prev) => (prev + 1) % heroContents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroContents.length]);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      const [orgsRes, needsRes, statsRes, donationsRes] = await Promise.allSettled([
        getOrganizations(true),
        getNeeds(undefined, undefined, true),
        getSystemStats(),
        getPublicRecentDonations(),
      ]);

      const orgs = orgsRes.status === "fulfilled" ? orgsRes.value : [];
      const allNeeds = needsRes.status === "fulfilled" ? needsRes.value : [];
      const systemStats = statsRes.status === "fulfilled" ? statsRes.value : null;
      const donations = donationsRes.status === "fulfilled" ? donationsRes.value : [];

      if (orgsRes.status === "fulfilled") {
        setOrganizations(orgs);
      }
      if (statsRes.status === "fulfilled") {
        setStats(systemStats);
      }
      if (donationsRes.status === "fulfilled") {
        const rawDonations = donations || [];
        // Group and interleave donations across organizations to showcase diverse donor contributions
        const orgMap = new Map<string, PublicDonation[]>();
        rawDonations.forEach((d) => {
          const org = d.organization_name || "Organization";
          if (!orgMap.has(org)) {
            orgMap.set(org, []);
          }
          orgMap.get(org)!.push(d);
        });

        if (orgMap.size > 1) {
          const interleaved: PublicDonation[] = [];
          const orgGroups = Array.from(orgMap.values());
          const maxCount = Math.max(...orgGroups.map((g) => g.length));
          for (let i = 0; i < maxCount; i++) {
            for (const group of orgGroups) {
              if (i < group.length) {
                interleaved.push(group[i]);
              }
            }
          }
          setRecentDonations(interleaved);
        } else {
          setRecentDonations(rawDonations);
        }
      }

      if (needsRes.status === "fulfilled" && allNeeds.length > 0) {
        // Filter for active, unfulfilled critical needs across all registered organizations
        const urgentNeeds = allNeeds.filter(
          (n) => n.priority === "CRITICAL" && n.quantity_confirmed < n.quantity_required
        );

        if (urgentNeeds.length > 0) {
          // Rank by least fulfilled (lowest fulfillment ratio) and newest (most recently created)
          const sortedNeeds = urgentNeeds.sort((a, b) => {
            // 1. Least fulfilled ratio first (e.g. 0% fulfilled before 30% fulfilled)
            const ratioA = a.quantity_required > 0 ? a.quantity_confirmed / a.quantity_required : 0;
            const ratioB = b.quantity_required > 0 ? b.quantity_confirmed / b.quantity_required : 0;

            // If there is a noticeable difference in fulfillment ratio, prioritize least fulfilled
            if (Math.abs(ratioA - ratioB) > 0.05) {
              return ratioA - ratioB;
            }

            // 2. Newest critical need first (latest created_at timestamp)
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (dateB !== dateA) {
              return dateB - dateA;
            }

            // 3. Fallback: highest remaining shortage
            const remainingA = a.quantity_required - a.quantity_confirmed;
            const remainingB = b.quantity_required - b.quantity_confirmed;
            return remainingB - remainingA;
          });
          setUrgentNeed(sortedNeeds[0]);
        } else {
          // If no unfulfilled critical need, find newest critical need or newest registered need
          const anyCritical = allNeeds
            .filter((n) => n.priority === "CRITICAL")
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

          if (anyCritical.length > 0) {
            setUrgentNeed(anyCritical[0]);
          } else {
            const sortedAll = [...allNeeds].sort(
              (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            setUrgentNeed(sortedAll[0] || null);
          }
        }

        // Compute success story needs based on highest progress (only with real donor support)
        const storiesSource = allNeeds
          .filter((n) => n.quantity_required > 0 && ((n.quantity_received || 0) > 0 || (n.quantity_confirmed || 0) > 0))
          .map((n) => {
            const receivedOrConfirmed = Math.max(n.quantity_received || 0, n.quantity_confirmed || 0);
            const progress = Math.min(
              100,
              Math.round((receivedOrConfirmed / n.quantity_required) * 100),
            );
            return {
              id: n.id,
              name: n.name,
              orgName: n.section_detail?.organization_name || "Healthcare Facility",
              progress,
              quantityReceived: n.quantity_received || 0,
              quantityRequired: n.quantity_required,
            };
          })
          .sort((a, b) => b.progress - a.progress || b.quantityReceived - a.quantityReceived)
          .slice(0, 3);

        const storiesList: SuccessStory[] = storiesSource.map((item, index) => ({
          id: item.id,
          title: `Success Story ${index + 1}`,
          name: item.name,
          orgName: item.orgName,
          progress: item.progress,
        }));

        setStories(storiesList);
      }
    } catch (err) {
      console.warn(
        "Backend API not available. Start with: python manage.py runserver",
        err instanceof Error ? err.message : "Failed to load data",
      );
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    queueMicrotask(() => {
      void fetchData(false);
    });

    // Auto-refresh data every 30 seconds for real-time synchronization
    const pollInterval = setInterval(() => {
      if (isMounted) {
        fetchData(true);
      }
    }, 30000);

    // Refresh immediately when window/tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMounted) {
        fetchData(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  if (loading || authLoading) return <PageLoading />;

  if (user?.role === "DONOR") {
    return <DonorDashboard />;
  }

  // Real-time backend stats with graceful zero defaults
  const provinces = stats?.provinces_covered ?? (organizations.length > 0 ? new Set(organizations.map((o) => o.district).filter(Boolean)).size : 0);
  const totalOrgs = stats?.verified_hospitals ?? organizations.length;
  const donorsOnboarded = stats?.donors_onboarded ?? 0;
  const deliverySuccessRate = stats?.delivery_success_rate ?? 0;


  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section id="hero-section" className="relative bg-[#030B1C] overflow-hidden flex flex-col justify-center min-h-[680px] lg:min-h-screen pt-24 sm:pt-28 pb-24 sm:pb-28 lg:pt-20 lg:pb-24">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1920&q=80"
            alt="Hero Background"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover opacity-60 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-[#030B1C]/40 mix-blend-multiply"></div>
        </div>

        {/* Marquee (Live Feed) - Positioned at bottom of hero */}
        <div className="absolute bottom-0 left-0 w-full z-20 bg-transparent border-t border-white/10">
          <div className="w-full py-2.5 sm:py-3 md:py-3.5 flex items-center relative overflow-hidden bg-black/20 backdrop-blur-sm">
            <div className="flex-1 overflow-hidden relative">
              {recentDonations.length > 0 ? (
                <div className="whitespace-nowrap inline-flex animate-marquee hover:[animation-play-state:paused] items-center">
                  {[...recentDonations, ...recentDonations].map((donation, i) => (
                    <span key={i} className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-sans font-normal tracking-wide mr-8 sm:mr-14 shrink-0 flex items-center gap-2 sm:gap-3">
                      {donation.donor_name}
                      <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-0.5">DONATED {donation.quantity} {donation.need_item_name} TO</span>
                      {donation.organization_name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-xs sm:text-sm md:text-base font-medium animate-pulse px-4 sm:px-6">
                  Waiting for live updates... Be the first to contribute!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mb-8 lg:mb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 xl:space-y-8 animate-fade-in-up flex flex-col items-start text-left w-full mt-4 lg:mt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-sm border border-white/10 shadow-lg">
                <span className="w-2 h-2 bg-success rounded-sm animate-pulse-ring"></span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Live across Sri Lanka
                </span>
              </div>
              
              <div key={currentContentIndex} className="animate-fade-in space-y-4 sm:space-y-6 xl:space-y-8 w-full min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[200px] xl:min-h-[250px]">
                <h1 className="text-left font-heading text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-5xl font-bold leading-tight tracking-tight text-white max-w-3xl uppercase">
                  {heroContents[currentContentIndex].prefix}
                  <span className="text-primary">
                    {heroContents[currentContentIndex].highlight}
                  </span>
                  {heroContents[currentContentIndex].suffix}
                </h1>
                
                <p className="text-left font-label text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                  {heroContents[currentContentIndex].subtext}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-1 pb-3 lg:pb-0 w-full justify-start items-start">
                <Link href="/needs" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-primary hover:bg-teal-700 text-white text-sm sm:text-base font-bold rounded-full shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Donate Now
                </Link>
              </div>
            </div>

            {/* Right Column: Most Urgent Need Widget */}
            <div className="lg:col-span-5 relative animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white/5 backdrop-blur-1xl border border-white/10 rounded-none p-5 sm:p-6 md:p-8 lg:p-6 xl:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -inset-20 bg-red-700/15 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 to-red-600"></div>
                <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse" />
                    <span className="font-label text-xs font-bold text-red-500 uppercase tracking-widest">Most Urgent Need</span>
                  </div>
                </div>
                {urgentNeed ? (
                  <div className="space-y-5 sm:space-y-6 xl:space-y-8 relative z-10">
                    <div>
                      <h3 className="font-heading text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">{urgentNeed.name}</h3>
                      <p className="font-body text-slate-300 font-medium flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <Building className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate">
                          {urgentNeed.section_detail?.organization_name || 
                           organizations.find((o) => o.id === urgentNeed.section_detail?.organization || o.id === (urgentNeed as unknown as { organization?: number }).organization)?.name || 
                           "Verified Healthcare Facility"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm font-bold font-label tracking-wide">
                        <span className="text-slate-300">
                          <AnimatedStat
                            value={urgentNeed.quantity_confirmed}
                            suffix={urgentNeed.unit ? ` ${urgentNeed.unit} pledged` : " pledged"}
                          />
                        </span>
                        <span className="text-red-500">Target: {urgentNeed.quantity_required} {urgentNeed.unit}</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-red-800 to-red-600 rounded-full transition-all duration-1000 relative" style={{ width: `${Math.min(100, Math.round((urgentNeed.quantity_confirmed / urgentNeed.quantity_required) * 100))}%` }}>
                           <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <Link href={`/needs`} className="w-full flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-red-700 hover:bg-red-800 text-white text-sm sm:text-base font-bold rounded-full transition-all shadow-lg transform hover:-translate-y-1">
                      Fulfill this need <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-300 mb-4">Finding critical needs...</p>
                    <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How it Works (Timeline) */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-20 animate-fade-in-up">
            <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full font-label text-sm font-bold tracking-[0.2em] uppercase text-cyan-500">
              How it works
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Making an impact is simple
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-300 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-4 border-white shadow-xl mb-6 relative hover:scale-110 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">1</div>
                  <Eye className="w-[40px] h-[40px] text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">Browse Needs</h3>
                <p className="font-body text-base text-slate-500 leading-relaxed max-w-xs">Verified organizations post their critical requirements. Browse and find a cause that resonates with you.</p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border-4 border-white shadow-xl mb-6 relative hover:scale-110 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">2</div>
                  <HandHeart className="w-[40px] h-[40px] text-green-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">Donate Securely</h3>
                <p className="font-body text-base text-slate-500 leading-relaxed max-w-xs">Commit to fulfilling a need entirely or partially. Every contribution moves the progress bar forward.</p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center border-4 border-white shadow-xl mb-6 relative hover:scale-110 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">3</div>
                  <CheckCircle className="w-[40px] h-[40px] text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">Track Impact</h3>
                <p className="font-body text-base text-slate-500 leading-relaxed max-w-xs">Follow your donation end-to-end. Get notified when your items are received by the organization.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Impact Banner */}
      <section id="stats-banner" ref={statsSectionRef} className="bg-slate-950 py-6 sm:py-8 border-y border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 md:divide-x divide-white/10">
            <div 
              style={{ transitionDelay: statsVisible ? "0ms" : "0ms" }}
              className={`text-center px-2 sm:px-4 hover:scale-105 transition-all duration-700 ease-out ${
                statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 transition-transform duration-300 hover:-translate-y-1 hover:translate-x-0.5 hover:-rotate-12" />
              </div>
              <div className="font-body text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 tabular-nums mb-1">
                <AnimatedStat value={statsVisible ? provinces : 0} duration={1200} />
              </div>
              <div className="font-label text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase text-slate-400 mt-1">Provinces Covered</div>
            </div>

            <div 
              style={{ transitionDelay: statsVisible ? "120ms" : "0ms" }}
              className={`text-center px-2 sm:px-4 hover:scale-105 transition-all duration-700 ease-out ${
                statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 transition-transform duration-300 hover:scale-110 hover:text-emerald-400" />
              </div>
              <div className="font-body text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 tabular-nums mb-1">
                <AnimatedStat value={statsVisible ? totalOrgs : 0} duration={1200} />
              </div>
              <div className="font-label text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase text-slate-400 mt-1">Verified Organizations</div>
            </div>

            <div 
              style={{ transitionDelay: statsVisible ? "240ms" : "0ms" }}
              className={`text-center px-2 sm:px-4 hover:scale-105 transition-all duration-700 ease-out ${
                statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 transition-transform duration-300 hover:scale-125 hover:text-rose-400" />
              </div>
              <div className="font-body text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 tabular-nums mb-1">
                <AnimatedStat value={statsVisible ? donorsOnboarded : 0} duration={1200} />
              </div>
              <div className="font-label text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase text-slate-400 mt-1">Donors Onboarded</div>
            </div>

            <div 
              style={{ transitionDelay: statsVisible ? "360ms" : "0ms" }}
              className={`text-center px-2 sm:px-4 hover:scale-105 transition-all duration-700 ease-out ${
                statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 transition-transform duration-300 hover:scale-110 hover:text-teal-400" />
              </div>
              <div className="font-body text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 tabular-nums mb-1">
                <AnimatedStat value={statsVisible ? deliverySuccessRate : 0} suffix="%" duration={1200} />
              </div>
              <div className="font-label text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase text-slate-400 mt-1">Delivery Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section ref={storiesSectionRef} className="py-14 sm:py-20 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16 animate-fade-in-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Recent Successes
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg">See how the community is coming together to fulfill critical requirements.</p>
          </div>

          {stories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {stories.map((story, i) => (
                <div key={story.id || i} className="bg-white rounded-none p-5 sm:p-6 md:p-8 border border-slate-100 shadow-md transition-all duration-300 group animate-fade-in-up hover:shadow-lg" style={{ animationDelay: `${0.1 * (i+1)}s` }}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 rounded-sm mb-4 sm:mb-6 font-label text-xs font-bold tracking-widest uppercase text-amber-600">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Organization
                  </div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-2 min-h-[44px] sm:min-h-[56px] line-clamp-2">
                    {story.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 min-h-[32px] sm:min-h-[40px] line-clamp-2 font-medium">
                    For {story.orgName}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-label text-xs font-semibold tracking-wider uppercase text-slate-400">Fulfillment Progress</span>
                      <span className="bg-green-50 px-2 py-0.5 rounded-sm font-body text-sm font-bold text-amber-500 tabular-nums">
                        <AnimatedStat value={storiesVisible ? story.progress : 0} suffix="%" />
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-warning to-success rounded-sm transition-all duration-1000" style={{ width: `${storiesVisible ? story.progress : 0}%` }}></div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium pt-2 text-right">Fulfilled by donors</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="font-heading font-bold text-slate-800 text-base mb-1">No Success Stories Published</h3>
              <p className="font-body text-xs sm:text-sm text-slate-500 max-w-sm">Impact milestones and successful fulfillment records will appear here as ongoing hospital needs are met.</p>
            </div>
          )}
        </div>
      </section>

      {/* Donation Trends / Impact Analytics */}
      <section id="impact" className="py-12 sm:py-16 md:py-20 bg-slate-50 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-8 sm:mb-12 animate-fade-in-up">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-primary/10 rounded-full font-label text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-cyan-600">
              Live Impact Analytics
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Donation Volume Trends
            </h2>
            <p className="font-body text-slate-500 max-w-2xl mx-auto text-sm sm:text-base px-2">
              Real-time monthly metrics tracking count of pledge donations vs verified fulfilled donations across all registered donors.
            </p>
          </div>

          <div className="bg-white rounded-none shadow-xl shadow-slate-200/50 p-4 sm:p-6 md:p-8 lg:p-10 border border-slate-100 overflow-hidden">
            <AnalyticsLineChart data={stats?.monthly_trends} />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Built on transparency <br/>and accountability.
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="shrink-0 pt-1 text-secondary">
                    <Eye className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">100% Transparent</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">Every need, donation, and fulfillment status is publicly visible on the platform.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="shrink-0 pt-1 text-secondary">
                    <Shield className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Super Admin Verified</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">Organizations undergo strict vetting before they can publish requirements.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="shrink-0 pt-1 text-secondary">
                    <Activity className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Real-time Tracking</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">Follow your contribution from the moment you pledge until it reaches the destination.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-sm transform rotate-3 scale-105 blur-lg"></div>
              <div className="bg-white p-10 md:p-12 rounded-sm shadow-xl border border-slate-100 relative z-10">
                <svg className="w-12 h-12 text-slate-200 mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-lg md:text-xl text-slate-700 italic font-medium leading-relaxed mb-8">
                  &quot;Parithyaga has completely transformed how we receive supplies. The transparency gives donors confidence, and we get exactly what we need, when we need it most.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=Dr+Samarakoon&background=e2e8f0&color=475569" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Dr. Samarakoon</div>
                    <div className="text-sm text-slate-500 font-medium">Director, Regional Hospital</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration CTA Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Donor CTA */}
            <div className="bg-slate-900 rounded-sm p-10 md:p-14 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-900/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-success/20 rounded-full blur-3xl transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between items-start space-y-10">
                <Heart className="w-12 h-12 text-primary mb-4" />
                <div>
                  <h2 className="font-heading text-2xl font-bold text-white mb-4 tracking-tight">I want to donate</h2>
                  <p className="font-body text-sm text-slate-300 leading-relaxed mt-2 mb-8 max-w-sm">
                    Create a free account and start contributing directly to verified organizational needs today.
                  </p>
                  <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-8 py-4 bg-success hover:bg-green-600 text-white rounded-full transition-all shadow-lg shadow-green-500/20 font-body text-sm font-semibold">
                    Become a Donor <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Hospital/Org CTA */}
            <div className="bg-white rounded-sm p-[2px] relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-secondary opacity-100 transition-opacity"></div>
              <div className="bg-white rounded-[2px] p-10 md:p-14 h-full relative z-10 flex flex-col justify-between items-start space-y-10">
                <Building className="w-12 h-12 text-primary mb-4" />
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4 tracking-tight">We&apos;re an organization</h2>
                  <p className="font-body text-sm text-slate-500 leading-relaxed mt-2 mb-8 max-w-sm">
                    Join Parithyaga to publish your requirements, manage donations, and reach donors nationwide.
                  </p>
                  <Link href="/login?tab=org-admin" className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 text-slate-900 rounded-full transition-all shadow-sm font-body text-sm font-semibold">
                    Register Organization <ArrowRight className="w-5 h-5 text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Coverage Map */}
      <section className="pt-24 pb-0 bg-slate-50 relative overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">
              Live Network Map
            </h2>
            <p className="font-body text-base text-blue-600 leading-relaxed mt-2 max-w-2xl mx-auto">Explore verified organizations and current active needs across Sri Lanka.</p>
          </div>
        </div>
        <div className="relative h-[480px] sm:h-[560px] md:h-[650px] w-full animate-scale-up z-10 border-y border-slate-200">
          <AdvancedSriLankaMap organizations={organizations} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 border-t border-slate-800 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Col 1 */}
            <div className="md:col-span-5 space-y-6">
              <Link href="/" className="flex items-center gap-3 inline-block">
                <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src="/images/Parithyaga_Logo.png" alt="Parithyaga Logo" width={40} height={40} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-lg font-semibold text-white">Parithyaga</span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Donation Platform</span>
                </div>
              </Link>
              <p className="text-sm leading-relaxed max-w-sm mt-4">
                A transparent, secure platform connecting verified organizations with willing donors to fulfill critical needs across Sri Lanka.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors hover:border-primary"><FaFacebook size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors hover:border-primary"><FaTwitter size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors hover:border-primary"><FaLinkedin size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors hover:border-primary"><FaInstagram size={18} /></a>
              </div>
            </div>
            
            {/* Col 2 */}
            <div className="md:col-span-3 lg:ml-8">
              <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><Link href="/" className="hover:text-primary transition-colors block">Home</Link></li>
                <li><Link href="/needs" className="hover:text-primary transition-colors block">Current Needs</Link></li>
                <li><Link href="/about" className="hover:text-primary transition-colors block">About Us</Link></li>
                <li><Link href="/#impact" className="hover:text-primary transition-colors block">Our Impact</Link></li>
                <li><Link href="/login?tab=register" className="hover:text-primary transition-colors block">Become a Donor</Link></li>
              </ul>
            </div>
            
            {/* Col 3 */}
            <div className="md:col-span-4 space-y-6">
              <h4 className="text-white font-bold mb-6 text-lg">Stay Updated</h4>
              <p className="text-sm leading-relaxed">Subscribe to our newsletter for the latest updates on critical needs and success stories.</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  id="newsletter-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  className="bg-slate-800/50 border border-slate-700 rounded-none px-4 py-3 text-sm w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white transition-all"
                />
                <button type="submit" className="bg-primary hover:bg-teal-700 text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/20">Subscribe</button>
              </form>
              <p className="text-xs text-slate-500 font-medium">We respect your privacy. No spam.</p>
            </div>
          </div>
          
          <div className="pt-8 pb-8 md:pb-0 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 font-label text-sm text-slate-400">
            <p className="text-center md:text-left">© {new Date().getFullYear()} Parithyaga Sri Lanka. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
