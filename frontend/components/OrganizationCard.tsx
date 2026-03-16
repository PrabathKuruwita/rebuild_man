import Link from 'next/link';
import { Organization } from '@/lib/api';

const orgTypeConfig: Record<string, { label: string; gradient: string; badge: string }> = {
  HOSPITAL:   { label: 'Hospital',     gradient: 'from-blue-600 to-blue-800',       badge: 'bg-blue-100 text-blue-800' },
  CLINIC:     { label: 'Clinic',       gradient: 'from-cyan-600 to-cyan-800',       badge: 'bg-cyan-100 text-cyan-800' },
  SCHOOL:     { label: 'School',       gradient: 'from-violet-600 to-violet-800',   badge: 'bg-violet-100 text-violet-800' },
  NGO:        { label: 'NGO',          gradient: 'from-emerald-600 to-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  CHARITY:    { label: 'Charity',      gradient: 'from-rose-600 to-rose-800',       badge: 'bg-rose-100 text-rose-800' },
  GOVERNMENT: { label: 'Government',   gradient: 'from-slate-600 to-slate-800',     badge: 'bg-slate-100 text-slate-800' },
  OTHER:      { label: 'Organization', gradient: 'from-gray-600 to-gray-800',       badge: 'bg-gray-100 text-gray-800' },
};

interface OrganizationCardProps {
  organization: Organization;
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  const type = orgTypeConfig[organization.org_type || 'OTHER'];

  const totalNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.length || 0), 0
  ) || 0;

  const criticalNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.filter(n => n.priority === 'CRITICAL').length || 0), 0
  ) || 0;

  const fulfilledNeeds = organization.sections?.reduce(
    (acc, section) => acc + (section.needs?.filter(n => n.quantity_received >= n.quantity_required).length || 0), 0
  ) || 0;

  const fulfillmentPct = totalNeeds > 0 ? Math.round((fulfilledNeeds / totalNeeds) * 100) : 0;

  return (
    <Link href={`/organizations/${organization.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group h-full flex flex-col">

        {/* Coloured gradient header */}
        <div className={`bg-gradient-to-br ${type.gradient} px-5 py-5 text-white`}>
          <div className="flex items-start justify-between mb-3">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${type.badge}`}>
              {type.label}
            </span>
            {criticalNeeds > 0 && (
              <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                {criticalNeeds} critical
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-lg leading-tight group-hover:underline decoration-white/50">
            {organization.name}
          </h3>
          <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {organization.district}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex-1 flex flex-col">
          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {organization.description || (
              <span className="italic text-gray-400">No description yet.</span>
            )}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              {organization.sections?.length || 0} sections
            </span>
            <span className="text-gray-300">·</span>
            <span>{totalNeeds} needs</span>
            {organization.established_year && (
              <>
                <span className="text-gray-300">·</span>
                <span>Est. {organization.established_year}</span>
              </>
            )}
          </div>

          {/* Fulfillment bar */}
          {totalNeeds > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Needs fulfilled</span>
                <span className="font-medium text-gray-600">{fulfillmentPct}%</span>
              </div>
              <progress
                value={fulfilledNeeds}
                max={totalNeeds}
                className="w-full h-1.5 rounded-full overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:bg-green-400 [&::-moz-progress-bar]:bg-green-400"
                aria-label="Needs fulfilled progress"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">Reg: {organization.registration_number}</span>
          <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
            View details
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
