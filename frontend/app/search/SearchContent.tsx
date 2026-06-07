"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { search, SearchResult } from "@/lib/api";
import NeedCard from "@/components/NeedCard";
import OrganizationCard from "@/components/OrganizationCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Search } from "lucide-react";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType =
    (searchParams.get("type") as "all" | "organization" | "need") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"organization" | "need" | "all">(
    initialType,
  );
  const [priority, setPriority] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const performSearch = useCallback(async () => {
    if (!query.trim() || query.length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await search(query, searchType, {
        priority: priority || undefined,
        limit: 50,
        excludeFulfilled: true,
      });
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, searchType, priority]);

  // Auto-search when query changes from URL params
  useEffect(() => {
    if (initialQuery) {
      queueMicrotask(() => {
        void performSearch();
      });
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search organizations, hospitals, needs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Type */}
              <div>
                <label
                  htmlFor="search-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search In
                </label>
                <select
                  id="search-type"
                  value={searchType}
                  onChange={(e) =>
                    setSearchType(
                      e.target.value as "all" | "organization" | "need",
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="organization">Organizations Only</option>
                  <option value="need">Needs Only</option>
                </select>
              </div>

              {/* Priority Filter (for needs) */}
              {searchType !== "organization" && (
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ESSENTIAL">Essential</option>
                    <option value="NICE">Nice to Have</option>
                  </select>
                </div>
              )}

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {results && !loading && (
          <>
            {/* Summary */}
            <div className="mb-8">
              <p className="text-gray-600">
                Found{" "}
                <span className="font-semibold text-gray-900">
                  {results.total}
                </span>{" "}
                result
                {results.total !== 1 ? "s" : ""} for &quot;
                <span className="font-semibold">{query}</span>&quot;
              </p>
            </div>

            {/* Organizations Results */}
            {results.organizations.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  Organizations
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {results.organizations.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.organizations.map((org) => (
                    <OrganizationCard key={org.id} organization={org} />
                  ))}
                </div>
              </div>
            )}

            {/* Needs Results */}
            {results.needs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  Needs
                  <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {results.needs.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.needs.map((need) => (
                    <NeedCard
                      key={need.id}
                      need={need}
                      organizationName={
                        need.section_detail?.organization_name || "Unknown"
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.organizations.length === 0 &&
              results.needs.length === 0 && (
                <div className="text-center py-12">
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 text-lg">
                    No results found for &quot;
                    <span className="font-semibold">{query}</span>&quot;
                  </p>
                  <p className="text-gray-500 mt-2">
                    Try searching with different keywords
                  </p>
                </div>
              )}
          </>
        )}

        {/* Initial State */}
        {!results && !loading && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">
              Enter a search query to get started
            </p>
            <p className="text-gray-500 mt-2">
              Search for organizations, hospitals, equipment, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
