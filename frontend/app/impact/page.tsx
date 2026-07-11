"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Donation,
  NeedItem,
  Organization,
  getPublicImpactDonations,
  getNeeds,
  getOrganizations,
} from "@/lib/api";
import { PageLoading } from "@/components/LoadingSpinner";

type MonthlyImpact = {
  label: string;
  value: number;
};

type DistrictImpact = {
  district: string;
  value: number;
};

type StoryCard = {
  title: string;
  body: string;
  progress: number;
};

export default function ImpactPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    async function loadImpactData() {
      setLoading(true);
      setError(null);
      setWarning(null);

      const promises: [
        Promise<Organization[]>,
        Promise<NeedItem[]>,
        Promise<Donation[]>,
      ] = [
          getOrganizations(),
          getNeeds(),
          getPublicImpactDonations(),
        ];

      const [orgResult, needsResult, donationResult] =
        await Promise.allSettled(promises);

      const organizationsLoaded = orgResult.status === "fulfilled";
      const needsLoaded = needsResult.status === "fulfilled";
      const donationsLoaded = donationResult.status === "fulfilled";

      if (organizationsLoaded) {
        setOrganizations(orgResult.value as Organization[]);
      } else {
        setOrganizations([]);
      }

      if (needsLoaded) {
        setNeeds(needsResult.value as NeedItem[]);
      } else {
        setNeeds([]);
      }

      if (donationsLoaded) {
        setDonations((donationResult.value as Donation[]) || []);
      } else {
        setDonations([]);
        setWarning(
          "Real-time donation analytics could not be fully loaded. Showing metrics based on available data.",
        );
      }

      if (!organizationsLoaded && !needsLoaded) {
        const orgError =
          orgResult.status === "rejected" ? String(orgResult.reason) : "";
        const needError =
          needsResult.status === "rejected" ? String(needsResult.reason) : "";
        setError(orgError || needError || "Failed to load impact analytics");
      }

      setLoading(false);
    }

    loadImpactData();
  }, []);

  const metrics = useMemo(() => {
    const successfulDonations = donations.filter(
      (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
    );

    const uniqueDonors = new Set(
      successfulDonations
        .map((d) =>
          d.donor_type === "private"
            ? d.donor_name?.trim()
            : d.government_department?.trim(),
        )
        .filter(Boolean),
    );

    const totalRequired = needs.reduce(
      (sum, n) => sum + n.quantity_required,
      0,
    );
    const totalReceived = needs.reduce(
      (sum, n) => sum + n.quantity_received,
      0,
    );
    const fulfilledNeedsCount = needs.filter(
      (n) =>
        n.quantity_required > 0 && n.quantity_confirmed >= n.quantity_required,
    ).length;

    const needMap = new Map<number, NeedItem>();
    for (const need of needs) {
      needMap.set(need.id, need);
    }

    const districtByNeed = new Map<number, string>();
    for (const org of organizations) {
      for (const section of org.sections || []) {
        for (const need of section.needs || []) {
          districtByNeed.set(need.id, org.district || "Unknown");
        }
      }
    }

    const districtTotals = new Map<string, number>();
    for (const donation of successfulDonations) {
      const district = districtByNeed.get(donation.need_item) || "Unknown";
      districtTotals.set(
        district,
        (districtTotals.get(district) || 0) + donation.quantity,
      );
    }

    const districtImpact: DistrictImpact[] = Array.from(
      districtTotals.entries(),
    )
      .map(([district, value]) => ({ district, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const monthTotals = new Map<string, number>();
    const monthLabels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthLabels.push(key);
      monthTotals.set(key, 0);
    }

    for (const donation of successfulDonations) {
      const date = new Date(donation.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthTotals.has(key)) {
        monthTotals.set(key, (monthTotals.get(key) || 0) + donation.quantity);
      }
    }

    const monthlyImpact: MonthlyImpact[] = monthLabels.map((key) => {
      const [year, month] = key.split("-").map(Number);
      const labelDate = new Date(year, month, 1);
      return {
        label: labelDate.toLocaleString("en", { month: "short" }),
        value: monthTotals.get(key) || 0,
      };
    });

    const topNeeds = needs
      .filter((n) => n.quantity_required > 0)
      .map((n) => ({
        name: n.name,
        progress: Math.min(
          100,
          Math.round((n.quantity_confirmed / n.quantity_required) * 100),
        ),
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    const stories: StoryCard[] = topNeeds.map((item, index) => ({
      title: `Success Story ${index + 1}`,
      body: `${item.name} reached ${item.progress}% coverage through community and institutional donations.`,
      progress: item.progress,
    }));

    if (stories.length === 0) {
      stories.push({
        title: "Building Momentum",
        body: "The platform is collecting the first wave of support and preparing measurable success stories.",
        progress: 0,
      });
    }

    return {
      totalOrganizations: organizations.length,
      totalDonations: donations.length,
      totalSuccessfulDonations: successfulDonations.length,
      uniqueDonors: uniqueDonors.size,
      totalReceived,
      totalRequired,
      fulfilledNeedsCount,
      totalNeedsCount: needs.length,
      fulfillmentRate:
        needs.length > 0
          ? Math.round((fulfilledNeedsCount / needs.length) * 100)
          : 0,
      coverageRate:
        totalRequired > 0
          ? Math.round((totalReceived / totalRequired) * 100)
          : 0,
      monthlyImpact,
      districtImpact,
      stories,
      latestSuccessfulDonations: successfulDonations
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          donor:
            d.donor_type === "private"
              ? d.donor_name || "Private Donor"
              : d.government_department || "Government Department",
          quantity: d.quantity,
          needName: needMap.get(d.need_item)?.name || "Need Item",
          date: new Date(d.created_at).toLocaleDateString(),
        })),
    };
  }, [donations, needs, organizations]);

  if (loading) return <PageLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-800">
            Unable to Load Impact Page
          </h1>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(
    ...metrics.monthlyImpact.map((m) => m.value),
    1,
  );
  const maxDistrictValue = Math.max(
    ...metrics.districtImpact.map((d) => d.value),
    1,
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-emerald-50">
      <div className="relative overflow-hidden border-b border-cyan-100 bg-linear-to-r from-cyan-700 via-sky-700 to-emerald-700">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            Impact Analytics
          </p>
          <h1 className="max-w-3xl text-4xl font-bold text-white sm:text-5xl">
            How This Platform Transforms Donations Into Real Outcomes
          </h1>
          <p className="mt-4 max-w-2xl text-base text-cyan-50 sm:text-lg">
            Track contribution momentum, district-level support, and delivery
            progress from donors to organizations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/needs"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-cyan-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              See Active Needs
            </Link>
            <Link
              href="/organizations"
              className="rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Explore Organizations
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {warning && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {warning}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-cyan-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Donations</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {metrics.totalDonations.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              {metrics.totalSuccessfulDonations.toLocaleString()} confirmed or
              fulfilled
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Supplies Delivered
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {metrics.totalReceived.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              of {metrics.totalRequired.toLocaleString()} requested units
            </p>
          </article>

          <article className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Needs Fulfillment Rate
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {metrics.fulfillmentRate}%
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {metrics.fulfilledNeedsCount} of {metrics.totalNeedsCount} needs
              fully covered
            </p>
          </article>

          <article className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active Donors</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {metrics.uniqueDonors.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              supporting {metrics.totalOrganizations.toLocaleString()}{" "}
              organizations
            </p>
          </article>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Donation Trend (Last 6 Months)
              </h2>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Units
              </span>
            </div>
            <div className="grid grid-cols-6 items-end gap-3">
              {metrics.monthlyImpact.map((month) => {
                const height = Math.max(
                  10,
                  Math.round((month.value / maxMonthlyValue) * 160),
                );
                return (
                  <div key={month.label} className="flex flex-col items-center">
                    <style>{`.bar-month-${month.label} { height: ${height}px; }`}</style>
                    <div className="mb-2 text-xs font-semibold text-gray-500">
                      {month.value}
                    </div>
                    <div
                      className={`w-full rounded-t-md bg-linear-to-t from-blue-500 to-cyan-400 bar-month-${month.label}`}
                    />
                    <div className="mt-2 text-xs font-medium text-gray-600">
                      {month.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Regional Distribution
              </h2>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Top Districts
              </span>
            </div>

            {metrics.districtImpact.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                District-level impact will appear as confirmed donations
                increase.
              </p>
            ) : (
              <div className="space-y-4">
                {metrics.districtImpact.map((item, index) => {
                  const width = Math.max(
                    5,
                    Math.round((item.value / maxDistrictValue) * 100),
                  );
                  return (
                    <div key={item.district}>
                      <style>{`.bar-district-${index} { width: ${width}%; }`}</style>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">
                          {item.district}
                        </span>
                        <span className="text-gray-500">
                          {item.value.toLocaleString()} units
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 bar-district-${index}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
          <article className="rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm xl:col-span-3">
            <h2 className="text-xl font-bold text-gray-900">Impact Stories</h2>
            <p className="mt-1 text-sm text-gray-500">
              A snapshot of needs that received strong donor support.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {metrics.stories.map((story, index) => (
                <div
                  key={story.title}
                  className="rounded-xl border border-amber-100 bg-linear-to-b from-amber-50/70 to-white p-4"
                >
                  <style>{`.bar-story-${index} { width: ${story.progress}%; }`}</style>
                  <h3 className="font-semibold text-gray-900">{story.title}</h3>
                  <p className="mt-2 min-h-16 text-sm leading-relaxed text-gray-600">
                    {story.body}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className={`h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500 bar-story-${index}`}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    {story.progress}% coverage
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Successful Donations
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest confirmed and fulfilled contributions.
            </p>

            <div className="mt-5 space-y-3">
              {metrics.latestSuccessfulDonations.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                  No successful donations yet. Check back once organizations
                  confirm deliveries.
                </p>
              )}

              {metrics.latestSuccessfulDonations.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.donor}
                    </p>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {entry.quantity} units
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{entry.needName}</p>
                  <p className="mt-1 text-xs text-gray-500">{entry.date}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-100 bg-linear-to-r from-cyan-600 to-emerald-600 p-7 text-white shadow-lg">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Grow Platform Impact Even Faster
              </h2>
              <p className="mt-2 max-w-2xl text-cyan-50">
                Current needs coverage is at {metrics.coverageRate}%. More
                donors and faster confirmations will help close the remaining
                gap.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/needs"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Support a Need
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                Join as Donor
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
