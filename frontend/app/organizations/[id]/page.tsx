'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Organization, getOrganization } from '@/lib/api';
import SectionAccordion from '@/components/SectionAccordion';
import { PageLoading } from '@/components/LoadingSpinner';

export default function OrganizationDetailPage() {
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    if (params.id) {
      fetchOrganization();
    }
  }, [params.id]);

  if (loading) return <PageLoading />;

  if (error || !organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Organization Not Found</h3>
          <p className="text-red-600 mb-4">{error || 'The requested organization does not exist'}</p>
          <Link href="/organizations" className="text-blue-600 hover:text-blue-700">
            ← Back to Organizations
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

  return (
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
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {organization.district}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reg: {organization.registration_number}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{organization.sections?.length || 0}</p>
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
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </button>
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
            <p className="text-gray-500 mb-4">Add sections to organize your needs</p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add First Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
