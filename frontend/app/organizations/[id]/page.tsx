'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Organization, getOrganization, createSection } from '@/lib/api';
import SectionAccordion from '@/components/SectionAccordion';
import { PageLoading } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/AuthContext';

const orgTypeConfig: Record<string, { label: string; gradient: string }> = {
  HOSPITAL:   { label: 'Hospital',     gradient: 'from-blue-600 to-blue-900' },
  CLINIC:     { label: 'Clinic',       gradient: 'from-cyan-600 to-cyan-900' },
  SCHOOL:     { label: 'School',       gradient: 'from-violet-600 to-violet-900' },
  NGO:        { label: 'NGO',          gradient: 'from-emerald-600 to-emerald-900' },
  CHARITY:    { label: 'Charity',      gradient: 'from-rose-600 to-rose-900' },
  GOVERNMENT: { label: 'Government',   gradient: 'from-slate-600 to-slate-900' },
  OTHER:      { label: 'Organization', gradient: 'from-gray-600 to-gray-900' },
};

export default function OrganizationDetailPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Section modal state
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionHead, setSectionHead] = useState('');
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  async function fetchOrganization() {
    try {
      const id = Number(params.id);
      const org = await getOrganization(id);
      setOrganization(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchOrganization();
    }
  }, [params.id]);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSectionSaving(true);
    setSectionError(null);
    try {
      await createSection({
        name: sectionName,
        head_of_section: sectionHead,
        organization: Number(params.id),
      });
      // Refresh org data to show new section
      await fetchOrganization();
      setShowAddSection(false);
      setSectionName('');
      setSectionHead('');
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Failed to create section');
    } finally {
      setSectionSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error || !organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Organization Not Found</h3>
          <p className="text-red-600 mb-4">{error || 'The requested organization does not exist'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.length || 0), 0
  ) || 0;

  const criticalNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.filter(n => n.priority === 'CRITICAL').length || 0), 0
  ) || 0;

  const fulfilledNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.filter(n => n.quantity_received >= n.quantity_required).length || 0), 0
  ) || 0;

  const typeConfig = orgTypeConfig[organization.org_type || 'OTHER'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero Banner */}
      <div className={`rounded-2xl overflow-hidden mb-6 bg-gradient-to-br ${typeConfig.gradient}`}>
        <div className="px-6 pt-6 pb-0 text-white">
          {/* Top row: back + edit */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
            {isAdmin && (
              <Link
                href={`/organizations/${organization.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Info
              </Link>
            )}
          </div>

          {/* Type badge */}
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white mb-3">
            {typeConfig.label}
          </span>

          {/* Name */}
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{organization.name}</h1>

          {/* Description */}
          {organization.description ? (
            <p className="text-white/80 text-base max-w-2xl leading-relaxed mb-5">{organization.description}</p>
          ) : isAdmin ? (
            <p className="text-white/50 italic text-sm mb-5">
              No description yet.{' '}
              <Link href={`/organizations/${organization.id}/edit`} className="underline hover:text-white">
                Add one →
              </Link>
            </p>
          ) : (
            <div className="mb-5" />
          )}

          {/* Contact info chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {organization.district && (
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs text-white/90">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {organization.district}{organization.address ? `, ${organization.address}` : ''}
              </span>
            )}
            {organization.phone && (
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs text-white/90">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {organization.phone}
              </span>
            )}
            {organization.email_contact && (
              <a
                href={`mailto:${organization.email_contact}`}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs text-white/90 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {organization.email_contact}
              </a>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs text-white/90 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
                Website
              </a>
            )}
            {organization.established_year && (
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs text-white/90">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Established {organization.established_year}
              </span>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-black/20 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{organization.sections?.length || 0}</p>
            <p className="text-xs text-white/60 mt-0.5">Sections</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalNeeds}</p>
            <p className="text-xs text-white/60 mt-0.5">Total Needs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-300">{criticalNeeds}</p>
            <p className="text-xs text-white/60 mt-0.5">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-300">{fulfilledNeeds}</p>
            <p className="text-xs text-white/60 mt-0.5">Fulfilled</p>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Yet</h3>
            <p className="text-gray-500 mb-4">No needs have been added to this organization yet</p>
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

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 transition-opacity" 
              onClick={() => { setShowAddSection(false); setSectionError(null); }}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Section</h3>
              
              <form onSubmit={handleAddSection} className="space-y-4">
                <div>
                  <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sectionName"
                    type="text"
                    required
                    placeholder="e.g. OPD, Kitchen, Maternity Ward"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sectionHead" className="block text-sm font-medium text-gray-700 mb-1">
                    Head of Section
                  </label>
                  <input
                    id="sectionHead"
                    type="text"
                    placeholder="e.g. Dr. Silva"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={sectionHead}
                    onChange={(e) => setSectionHead(e.target.value)}
                  />
                </div>

                {sectionError && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{sectionError}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddSection(false); setSectionError(null); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sectionSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sectionSaving ? 'Creating...' : 'Create Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
