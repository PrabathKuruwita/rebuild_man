"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  List,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SysAdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function SysAdminSidebar({
  isCollapsed,
  onToggle,
}: SysAdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard size={20} />,
      active: pathname === "/admin",
    },
    {
      label: "Manage Organizations",
      href: "/organizations",
      icon: <Building2 size={20} />,
      active: pathname === "/organizations",
    },
    {
      label: "Manage Approvals",
      href: "/admin/approvals",
      icon: <UserCheck size={20} />,
      active: pathname.startsWith("/admin/approvals"),
    },
    {
      label: "All Needs",
      href: "/needs",
      icon: <List size={20} />,
      active: pathname === "/needs",
    },
    {
      label: "View Donors",
      href: "/admin/donors",
      icon: <Users size={20} />,
      active: pathname.startsWith("/admin/donors"),
    },
    {
      label: "AI Uploads",
      href: "/documents",
      icon: <FileText size={20} />,
      active: pathname === "/documents",
    },
  ];

  return (
    <aside className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 bg-white border-r border-slate-100 z-[1030] shadow-xs transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Sidebar Header with Logo */}
        <div className={`h-16 sm:h-20 flex items-center px-6 border-b border-slate-100 mb-6 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : ""}`}>
          <Link href="/" className="flex items-center gap-2 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1">
            <Image 
              src="/images/Parithyaga_Logo.png" 
              alt="Parithyaga Logo" 
              width={40} 
              height={40}
              className="w-10 h-10 object-contain shrink-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                  Parithyaga
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
            System Admin Console
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2 relative">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isCollapsed ? "justify-center w-12 h-12 mx-auto px-0 py-0" : "px-4 py-3"
              } ${item.active
                ? "text-primary bg-blue-50/50"
                : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              {/* Animated active indicator */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-md transition-all duration-300 ease-out ${item.active ? "h-3/4 opacity-100" : "h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-30 group-hover:bg-slate-400"}`}></div>
              
              <div className={`shrink-0 z-10 transition-colors duration-300 ${item.active ? "text-primary" : "text-slate-400 group-hover:text-primary"}`}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="text-sm font-semibold font-body whitespace-nowrap z-10">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="px-4 border-t border-slate-100 pt-4 mt-auto">
          <button
            onClick={onToggle}
            className={`flex items-center gap-3 w-full text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0 py-0" : "px-4 py-3"}`}
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
