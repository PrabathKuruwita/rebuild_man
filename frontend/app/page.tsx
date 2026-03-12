'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Organization, NeedItem, getOrganizations, getNeeds } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import NeedCard from '@/components/NeedCard';
import OrganizationCard from '@/components/OrganizationCard';
import { PageLoading } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgs, needs] = await Promise.all([
          getOrganizations(),
          getNeeds('CRITICAL'),
        ]);
        setOrganizations(orgs);
        setCriticalNeeds(needs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <PageLoading />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalOrganizations = organizations.length;
  const totalSections = organizations.reduce((acc, org) => acc + (org.sections?.length || 0), 0);
  const totalNeeds = organizations.reduce(
    (acc, org) => acc + (org.sections?.reduce((sacc, sec) => sacc + (sec.needs?.length || 0), 0) || 0), 
    0
  );
  const totalCritical = criticalNeeds.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN'
            ? 'Dashboard'
            : "What's Needed Right Now"}
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN'
            ? 'Overview of all organizational needs'
            : 'Browse organizations and find ways to contribute'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-6 sm:grid-cols-2 ${user?.role === 'DONOR' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} mb-8`}>
        {(user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN') && (
          <>
            <StatsCard
              title="Organizations"
              value={totalOrganizations}
              subtitle="Active organizations"
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <StatsCard
              title="Sections"
              value={totalSections}
              subtitle="Departments tracked"
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
          </>
        )}
        <StatsCard
          title="Total Needs"
          value={totalNeeds}
          subtitle="Items registered"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatsCard
          title="Critical Needs"
          value={totalCritical}
          subtitle="Urgent attention required"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Critical Needs Section */}
      {criticalNeeds.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🚨 Critical Needs</h2>
              <p className="text-sm text-gray-500">Items requiring immediate attention</p>
            </div>
            <Link 
              href="/needs?priority=CRITICAL"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {criticalNeeds.slice(0, 6).map((need) => (
              <NeedCard key={need.id} need={need} showSection />
            ))}
          </div>
        </div>
      )}

      {/* Organizations Section - Visible to Everyone */}
      <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Organizations</h2>
              <p className="text-sm text-gray-500">Browse organizations and their needs</p>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN') && (
              <Link 
                href="/organizations"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Manage →
              </Link>
            )}
          </div>
          
          {organizations.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.slice(0, 6).map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first organization</p>
              <Link 
                href="/organizations/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Organization
              </Link>
            </div>
          )}
        </div>
    </div>
  );
}
