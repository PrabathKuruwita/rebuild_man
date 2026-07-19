"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getDonors, DonorUser } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Search, X } from "lucide-react";

export default function DonorsPage() {
  const { user } = useAuth();
  const [donors, setDonors] = useState<DonorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDonors = donors.filter((donor) => {
    const username = (donor.username || "").toLowerCase();
    const fullName = `${donor.first_name || ""} ${donor.last_name || ""}`.toLowerCase();
    const email = (donor.email || "").toLowerCase();
    const joinedDateStr = new Date(donor.date_joined).toLocaleDateString().toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      username.includes(query) ||
      fullName.includes(query) ||
      email.includes(query) ||
      joinedDateStr.includes(query)
    );
  });

  const loadDonors = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError("");
      const donorList = await getDonors();
      setDonors(donorList);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to load donors list");
      console.error(error);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      queueMicrotask(() => {
        void loadDonors();
      });

      // Auto-refresh data every 30 seconds for real-time updates
      const interval = setInterval(() => {
        loadDonors(true);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [user, loadDonors]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Access denied. Only system admins can view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Registered Donors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and monitor donors registered in the platform
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      {/* Search Input in standard Approvals styling */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between transition-all duration-300 hover:shadow-md">
        <div className="search-bar-container">
          <Search className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search by username, full name, email, or joined date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="min-w-full min-w-[1000px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Full Name
                </th>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Joined Date
                </th>
                <th
                  scope="col"
                  className="table-th sticky top-0 z-10"
                >
                  Total Donations
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredDonors.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-td text-center text-gray-500"
                  >
                    No matching donors found.
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => (
                  <tr key={donor.id} className="table-tr-hover">
                    <td className="table-td whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {donor.username}
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {donor.first_name || donor.last_name
                          ? `${donor.first_name || ""} ${donor.last_name || ""}`.trim()
                          : "-"}
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {donor.email}
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {donor.phone_number || "-"}
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap text-gray-500">
                      {new Date(donor.date_joined).toLocaleDateString()}
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {donor.donations_count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
