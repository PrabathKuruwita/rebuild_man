'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { NeedItem, getNeeds, priorityLabels } from '@/lib/api';
import NeedCard from '@/components/NeedCard';
import PriorityFilter from '@/components/PriorityFilter';
import { PageLoading } from '@/components/LoadingSpinner';

export default function NeedsPage() {
  const searchParams = useSearchParams();
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(
    searchParams.get('priority')
  );
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'progress'>('priority');

  useEffect(() => {
    async function fetchNeeds() {
      setLoading(true);
      try {
        const data = await getNeeds(priorityFilter || undefined);
        setNeeds(data);
      } catch (error) {
        console.error('Failed to fetch needs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNeeds();
  }, [priorityFilter]);

  // Sort needs
  const sortedNeeds = [...needs].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { CRITICAL: 0, ESSENTIAL: 1, NICE: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'progress') {
      const progressA = a.quantity_required > 0 ? a.quantity_received / a.quantity_required : 0;
      const progressB = b.quantity_required > 0 ? b.quantity_received / b.quantity_required : 0;
      return progressA - progressB; // Show least fulfilled first
    }
    return 0;
  });

  // Stats
  const stats = {
    total: needs.length,
    critical: needs.filter(n => n.priority === 'CRITICAL').length,
    essential: needs.filter(n => n.priority === 'ESSENTIAL').length,
    nice: needs.filter(n => n.priority === 'NICE').length,
    fulfilled: needs.filter(n => n.quantity_received >= n.quantity_required).length,
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Needs</h1>
        <p className="text-gray-500 mt-1">View and manage all registered needs across organizations</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Total: <strong>{stats.total}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Critical: <strong>{stats.critical}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Essential: <strong>{stats.essential}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Nice to Have: <strong>{stats.nice}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Fulfilled: <strong>{stats.fulfilled}</strong></span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PriorityFilter selected={priorityFilter} onChange={setPriorityFilter} />
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'date' | 'progress')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="priority">Priority</option>
            <option value="date">Most Recent</option>
            <option value="progress">Least Fulfilled</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {priorityFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {sortedNeeds.length} {priorityLabels[priorityFilter as keyof typeof priorityLabels]} needs
          </span>
          <button
            onClick={() => setPriorityFilter(null)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Needs Grid */}
      {sortedNeeds.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedNeeds.map((need) => (
            <NeedCard key={need.id} need={need} showSection />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Needs Found</h3>
          <p className="text-gray-500">
            {priorityFilter 
              ? `No ${priorityLabels[priorityFilter as keyof typeof priorityLabels]} needs registered`
              : 'No needs have been registered yet'}
          </p>
        </div>
      )}
    </div>
  );
}
