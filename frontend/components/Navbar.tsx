"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { UserCircle, Bell, Search } from "lucide-react";
import MobileNav from "./MobileNav";
import { useNotifications } from "@/lib/NotificationContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const isOrgAdminPath =
    pathname.startsWith("/org-admin") ||
    pathname === "/organizations" ||
    (pathname.startsWith("/organizations/") && pathname.endsWith("/edit")) ||
    pathname === "/admin/donations" ||
    pathname === "/documents" ||
    pathname === "/needs" ||
    pathname === "/notifications";

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname === "/organizations" ||
    pathname === "/needs" ||
    pathname === "/documents" ||
    pathname === "/notifications";

  const isSidebarLayout =
    (user?.role === "ORG_ADMIN" && isOrgAdminPath) ||
    (user?.role === "ADMIN" && isAdminPath);

  const navRef = useRef<HTMLElement>(null);

  // Close profile panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    if (showProfile) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  // Close notifications panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const handleNavMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const navEl = navRef.current;
    if (!navEl) return;
    const rect = navEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    navEl.style.setProperty("--mx", `${x}px`);
    navEl.style.setProperty("--my", `${y}px`);
  };

  return (
    <nav
      ref={navRef}
      onMouseMove={handleNavMouseMove}
      className={`bg-white/90 backdrop-blur-md border-b border-gray-100 fixed top-0 left-0 right-0 h-16 sm:h-20 z-[1020] transition-all duration-300 ${isSidebarLayout ? "navbar-sidebar-offset" : "w-full"}`}
    >
      <div className={isSidebarLayout ? "w-full px-4 sm:px-8" : "max-w-7xl mx-auto px-3 sm:px-6 lg:px-8"}>
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo - Responsive sizing */}
          <div className={`shrink-0 flex items-center ${isSidebarLayout ? "lg:hidden" : ""}`}>
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
              {/* Text hidden on mobile, shown on tablet+ */}
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg sm:text-xl text-slate-900 leading-tight tracking-tight">
                  NeedTracker
                </span>
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Donation Platform
                </span>
              </div>
            </Link>
          </div>


          {/* Navigation Links - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 ml-12">


            {(!user || (user.role !== "ADMIN" && user.role !== "ORG_ADMIN")) && (
              <>
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-blue-600"}`}
                >
                  {user?.role === "DONOR" ? "Dashboard" : "Home"}
                </Link>
                <Link
                  href="/needs"
                  className={`text-sm font-medium transition-colors ${pathname === "/needs" ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-blue-600"}`}
                >
                  Current Needs
                </Link>
              </>
            )}
          </div>

          {/* Search + Auth Section */}
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-4">
            {/* Desktop Auth Buttons - Hidden on mobile */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=register"
                  className="text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 touch-manipulation whitespace-nowrap"
                >
                  Become a Donor
                </Link>
                <Link
                  href="/login?tab=org-admin"
                  className="text-xs sm:text-sm font-bold text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg shadow-lg shadow-blue-600/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0 touch-manipulation whitespace-nowrap"
                >
                  Register Organization
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                {/* Pulsing System Status */}
                {isSidebarLayout && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full animate-fade-in mr-2 shrink-0 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">System Online</span>
                  </div>
                )}
                {/* Notifications Bell Dropdown */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors relative touch-manipulation animate-fade-in"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-scale-up">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              onClick={async () => {
                                if (!n.is_read) {
                                  await markAsRead(n.id);
                                }
                                setShowNotifications(false);
                                router.push(`/notifications?id=${n.id}`);
                              }}
                              className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 relative ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1">
                                  <p className={`text-xs text-slate-900 truncate ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>
                                    {n.title}
                                  </p>
                                  <span className="text-[9px] text-slate-400 shrink-0">
                                    {formatTimeAgo(n.created_at)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                  {n.message}
                                </p>
                              </div>
                              {!n.is_read && (
                                <span className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-gray-100 bg-slate-50">
                        <Link
                          href="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-xs font-bold text-blue-600 hover:text-blue-700 py-1.5 transition-colors"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Trigger */}
                <div className="relative flex items-center gap-2" ref={panelRef}>
                  {user.role && (
                    <div className="hidden md:flex flex-col items-end mr-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {user.role === "ADMIN" ? "Admin" : user.role === "ORG_ADMIN" ? "Org Admin" : "Donor"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-100 hover:bg-blue-100 transition-colors touch-manipulation"
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-scale-up">
                      <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {user.username}
                            </p>
                            <p className="text-blue-100 text-[10px] uppercase tracking-wider font-bold">
                              {user.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group touch-manipulation"
                        >
                          <UserCircle
                            size={18}
                            className="text-slate-400 group-hover:text-blue-600"
                          />
                          My Profile
                        </Link>

                        <button
                          onClick={() => {
                            setShowProfile(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors group border-t border-slate-50 mt-1 pt-3 touch-manipulation"
                        >
                          <svg
                            className="w-[18px] h-[18px] text-slate-400 group-hover:text-rose-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu - Only on mobile */}
            <MobileNav />
          </div>
        </div>
      </div>
    </nav>
  );
}
