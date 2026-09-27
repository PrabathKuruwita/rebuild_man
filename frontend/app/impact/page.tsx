"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSystemStats, SystemStats, getNeeds, getOrganizations, Organization } from "@/lib/api";
import { HeartHandshake, MapPin, Building2, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import AdvancedSriLankaMap from "@/components/AdvancedSriLankaMap";
import AnimatedStat from "@/components/AnimatedStat";
import { PageLoading } from "@/components/LoadingSpinner";
import AnalyticsLineChart from "@/components/AnalyticsLineChart";

export default function ImpactPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [successStories, setSuccessStories] = useState<{ title: string; body: string; progress: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImpactData() {
      try {
        const [statsData, orgsData, needsData] = await Promise.all([
          getSystemStats().catch(() => null),
          getOrganizations(true).catch(() => []),
          getNeeds(undefined, false, true).catch(() => []),
        ]);

        setStats(statsData);
        setOrganizations(orgsData);

        // Find fulfilled or highest progressed needs across all organizations for success stories
        const storiesSource = needsData
          .filter((need) => need.quantity_required > 0)
          .map((item) => {
            const receivedOrConfirmed = Math.max(item.quantity_received || 0, item.quantity_confirmed || 0);
            const progress = Math.min(100, Math.round((receivedOrConfirmed / item.quantity_required) * 100));
            return {
              item,
              progress,
            };
          })
          .sort((a, b) => b.progress - a.progress || (b.item.quantity_received || 0) - (a.item.quantity_received || 0));

        const topProgressed = storiesSource.filter((s) => s.progress >= 50).slice(0, 3);
        const selectedForStories = topProgressed.length > 0 ? topProgressed : storiesSource.slice(0, 3);

        const storiesList = selectedForStories.map(({ item, progress }, index) => {
          const orgName = item.section_detail?.organization_name;
          const facilityText = orgName ? ` for ${orgName}` : "";
          return {
            title: `Success Story ${index + 1}: ${item.name}`,
            body: `Thanks to our donors, the requirement for ${item.name}${facilityText} reached ${progress}% coverage, significantly improving local healthcare delivery.`,
            progress,
          };
        });

        if (storiesList.length === 0) {
          storiesList.push({
            title: "Building Momentum",
            body: "The platform is coordinating donations across registered healthcare organizations and preparing measurable milestones.",
            progress: 100,
          });
        }
        setSuccessStories(storiesList);

      } catch (error) {
        console.error("Failed to load impact data", error);
      } finally {
        setLoading(false);
      }
    }
    loadImpactData();
  }, []);

  if (loading) return <PageLoading />;

  // Calculate real stats based on active platform data
  const provinces = stats ? stats.provinces_covered : 0;
  const totalOrgs = stats ? stats.verified_hospitals : organizations.length;
  const donorsOnboarded = stats ? stats.donors_onboarded.toLocaleString() : "0";
  const deliverySuccess = stats ? `${stats.delivery_success_rate}%` : "100%";

  // Organizations are passed directly to the map

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <div id="impact-header" className="bg-gradient-to-br from-teal-800 via-emerald-900 to-teal-950 text-white pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-emerald-500/30">
            Our Nationwide Impact
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Driving Change Across <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Sri Lanka</span>
          </h1>
          <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto leading-relaxed">
            See how community generosity and coordinated efforts are actively equipping our healthcare system and saving lives.
          </p>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Provinces Reached", value: provinces, icon: <MapPin className="text-emerald-500" size={24} /> },
            { label: "Hospitals Supported", value: totalOrgs, icon: <Building2 className="text-blue-500" size={24} /> },
            { label: "Active Donors", value: donorsOnboarded, icon: <HeartHandshake className="text-rose-500" size={24} /> },
            { label: "Delivery Success", value: deliverySuccess, icon: <TrendingUp className="text-teal-500" size={24} /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-none shadow-xl shadow-slate-200/50 p-6 flex flex-col items-center text-center border border-slate-100 transform transition-all hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-12 h-12 bg-slate-50 rounded-none flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-slate-800 mb-1">
                <AnimatedStat value={typeof stat.value === 'number' ? stat.value : parseInt(stat.value.toString().replace(/,/g, ''))} />
                {typeof stat.value === 'string' && stat.value.includes('%') && '%'}
                {typeof stat.value === 'string' && stat.value.includes('+') && '+'}
              </div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-8">
        <div className="bg-white rounded-none shadow-xl shadow-slate-200/50 p-6 sm:p-10 border border-slate-100">
          <AnalyticsLineChart data={stats?.monthly_trends} />
        </div>
      </div>

      {/* Map and Success Stories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Geographical Impact */}
          <div className="order-2 lg:order-1 bg-white p-8 rounded-none shadow-lg border border-slate-100 h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Needs Distributed Across Regions</h2>
            <p className="text-slate-500 text-sm mb-6">A live visualization of where organizations are currently receiving support.</p>
            <div className="flex-1 bg-slate-50 rounded-none overflow-hidden relative border border-slate-100">
              <AdvancedSriLankaMap organizations={organizations} />
            </div>
          </div>

          {/* Right Column: Success Stories */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Real Impact, Real Stories</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Every donation translates into direct support for healthcare facilities. Here are some of our most recent milestones achieved through your contributions.
              </p>
            </div>

            <div className="space-y-6">
              {successStories.map((story, i) => (
                <div key={i} className="bg-white rounded-none p-6 shadow-sm border border-slate-200 hover:border-emerald-300 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{story.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {story.body}
                      </p>
                      
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${story.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs font-bold text-emerald-700 text-right">
                        {story.progress}% FULFILLED
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Call To Action */}
      <div className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Ready to make your impact?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of donors already making a difference in the national healthcare system. Every contribution counts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?tab=register"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-200 flex items-center justify-center gap-2"
            >
              Become a Donor <ArrowRight size={20} />
            </Link>
            <Link 
              href="/needs"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-lg transition-colors flex items-center justify-center"
            >
              View Current Needs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
