"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateCurrentUser } from "@/lib/api";
import { Search, UserCircle, Menu, X } from "lucide-react";
import MobileNav from "./MobileNav";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const navRef = useRef<HTMLElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    if (showProfile) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const updated = await updateCurrentUser(profileForm);
      setUser(updated);
      setProfileSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password2: "",
  });

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateCurrentUser(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password2: "",
      });
      setProfileSuccess("Password changed successfully.");
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "ORG_ADMIN";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const publicNavLinks = [
    { href: "/", label: "Home" },
    { href: "/needs", label: "Current Needs" },
  ];

  const navLinks = isAdmin
    ? [
      { href: "/", label: "Dashboard" },
      { href: "/organizations", label: "Organizations" },
      { href: "/needs", label: "All Needs" },
      ...(user?.role === "ADMIN"
        ? [
          { href: "/admin/approvals", label: "Approvals" },
          { href: "/admin/donors", label: "Donors" },
        ]
        : []),
      ...(user?.role === "ORG_ADMIN"
        ? [
          { href: "/documents", label: "Documents" },
          { href: "/admin/donations", label: "Donations" },
        ]
        : []),
    ]
    : [
      { href: "/", label: "Dashboard" },
      { href: "/needs", label: "Current Needs" },
    ];

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
      className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo - Responsive sizing */}
          <div className="shrink-0 flex items-center">
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
            {user?.role === "ADMIN" || user?.role === "ORG_ADMIN" ? (
              <>
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/org-admin"}
                  className={`text-sm font-semibold transition-colors ${pathname === "/admin" || pathname === "/org-admin" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/organizations"
                  className={`text-sm font-semibold transition-colors ${pathname === "/organizations" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}
                >
                  Organizations
                </Link>
                <Link
                  href="/needs"
                  className={`text-sm font-semibold transition-colors ${pathname === "/needs" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}
                >
                  All Needs
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  How it works
                </Link>
                <Link
                  href="/needs"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Current Needs
                </Link>
              </>
            )}
          </div>

          {/* Search + Auth Section */}
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-4">
            {/* Search Bar - Hidden on mobile and tablet */}
            <div className="hidden xl:block relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-40 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery("");
                  }
                }}
              />
            </div>

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
              <div className="hidden sm:flex items-center gap-2 relative" ref={panelRef}>
                {(user.role === "ADMIN" || user.role === "ORG_ADMIN") && (
                  <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {user.role === "ADMIN" ? "Admin" : "Org Admin"}
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
            )}

            {/* Mobile Menu - Only on mobile */}
            <MobileNav
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={(query) => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setSearchQuery("");
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
