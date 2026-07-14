"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrganizations } from "@/lib/api";
import {
  LayoutDashboard,
  ClipboardList,
  HeartHandshake,
  FileText,
  List,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OrgAdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function OrgAdminSidebar({
  isCollapsed,
  onToggle,
}: OrgAdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orgId, setOrgId] = useState<number | null>(null);

  const isProfileTab = searchParams.get("profile") === "true";

  useEffect(() => {
    async function loadOrg() {
      try {
        const orgs = await getOrganizations();
        if (orgs.length > 0) {
          setOrgId(orgs[0].id);
        }
      } catch (err) {
        console.error("Failed to load organization in sidebar:", err);
      }
    }
    loadOrg();
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      href: "/org-admin",
      icon: <LayoutDashboard size={20} />,
      active: pathname === "/org-admin",
    },
    {
      label: "Manage Needs",
      href: "/organizations#sections-needs",
      icon: <ClipboardList size={20} />,
      active: pathname === "/organizations" && !isProfileTab,
    },
    {
      label: "Track Donations",
      href: "/admin/donations",
      icon: <HeartHandshake size={20} />,
      active: pathname.startsWith("/admin/donations"),
    },
    {
      label: "AI Uploads",
      href: "/documents",
      icon: <FileText size={20} />,
      active: pathname === "/documents",
    },
    {
      label: "All Needs",
      href: "/needs",
      icon: <List size={20} />,
      active: pathname === "/needs",
    },
    {
      label: "Manage Admins",
      href: "/org-admin/manage-admins",
      icon: <Users size={20} />,
      active: pathname === "/org-admin/manage-admins",
    },
    {
      label: "Organization Profile",
      href: "/organizations?profile=true",
      icon: <Building2 size={20} />,
      active: (pathname === "/organizations" && isProfileTab) || (pathname.startsWith("/organizations/") && pathname.endsWith("/edit")),
    },
  ];

  return (
    <aside className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 bg-white border-r border-slate-100 z-[1030] shadow-xs transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Sidebar Header with Logo */}
        <div className={`h-16 sm:h-20 flex items-center px-6 border-b border-slate-100 mb-6 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : ""}`}>
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <svg
                className="w-5 sm:w-6 h-5 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                  NeedTracker
                </span>
                <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">
                  Donation Platform
                </span>
              </div>
            )}
          </Link>
        </div>

        <div className={`px-6 mb-4 transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100"}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Organization Admin Console
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0 py-0" : "px-4 py-3"} ${item.active
                ? "bg-blue-50/70 text-blue-600 border-r-4 border-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
            >
              <div className={`shrink-0 ${item.active ? "text-blue-600" : "text-slate-400"}`}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="px-4 border-t border-slate-100 pt-4 mt-auto">
          <button
            onClick={onToggle}
            className={`flex items-center gap-3 w-full text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0 py-0" : "px-4 py-3"}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="text-slate-400 shrink-0">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </div>
            {!isCollapsed && <span className="text-sm font-semibold whitespace-nowrap">Collapse Sidebar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
