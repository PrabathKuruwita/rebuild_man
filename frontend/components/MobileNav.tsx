"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Menu, X, Search } from "lucide-react";

interface MobileNavProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (query: string) => void;
}

export default function MobileNav({
  searchQuery,
  onSearchChange,
  onSearch,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on navigation
  const handleNavClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setIsOpen(false);
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "ORG_ADMIN";

  return (
    <div className="md:hidden relative" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-14 w-screen md:hidden bg-white border-b border-gray-100 shadow-xl z-40 max-w-sm mx-auto animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ maxWidth: "calc(100vw - 1rem)" }}
        >
          <div className="max-h-[80vh] overflow-y-auto">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch}>
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 touch-manipulation"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col py-2 px-2">
              {isAdmin ? (
                <>
                  <MobileNavLink
                    href={user?.role === "ADMIN" ? "/admin" : "/org-admin"}
                    label="Dashboard"
                    isActive={pathname === "/admin" || pathname === "/org-admin"}
                    onClick={() => handleNavClick(
                      user?.role === "ADMIN" ? "/admin" : "/org-admin"
                    )}
                  />
                  <MobileNavLink
                    href="/organizations"
                    label="Organizations"
                    isActive={pathname === "/organizations"}
                    onClick={() => handleNavClick("/organizations")}
                  />
                  <MobileNavLink
                    href="/needs"
                    label="All Needs"
                    isActive={pathname === "/needs"}
                    onClick={() => handleNavClick("/needs")}
                  />

                  {user?.role === "ORG_ADMIN" && (
                    <>
                      <MobileNavLink
                        href="/documents"
                        label="Documents"
                        isActive={pathname === "/documents"}
                        onClick={() => handleNavClick("/documents")}
                      />
                      <MobileNavLink
                        href="/admin/donations"
                        label="Donations"
                        isActive={pathname === "/admin/donations"}
                        onClick={() => handleNavClick("/admin/donations")}
                      />
                      <MobileNavLink
                        href="/org-admin/manage-admins"
                        label="Admins"
                        isActive={pathname === "/org-admin/manage-admins"}
                        onClick={() => handleNavClick("/org-admin/manage-admins")}
                      />
                    </>
                  )}

                  {user?.role === "ADMIN" && (
                    <>
                      <MobileNavLink
                        href="/admin/approvals"
                        label="Approvals"
                        isActive={pathname === "/admin/approvals"}
                        onClick={() => handleNavClick("/admin/approvals")}
                      />
                      <MobileNavLink
                        href="/admin/donors"
                        label="Donors"
                        isActive={pathname === "/admin/donors"}
                        onClick={() => handleNavClick("/admin/donors")}
                      />
                    </>
                  )}
                </>
              ) : user ? (
                <>
                  <MobileNavLink
                    href="/"
                    label="Dashboard"
                    isActive={pathname === "/"}
                    onClick={() => handleNavClick("/")}
                  />
                  <MobileNavLink
                    href="/needs"
                    label="Current Needs"
                    isActive={pathname === "/needs"}
                    onClick={() => handleNavClick("/needs")}
                  />
                  <MobileNavLink
                    href="/profile"
                    label="My Profile"
                    isActive={pathname === "/profile"}
                    onClick={() => handleNavClick("/profile")}
                  />
                </>
              ) : (
                <>
                  <MobileNavLink
                    href="/#how-it-works"
                    label="How it works"
                    onClick={() => setIsOpen(false)}
                  />
                  <MobileNavLink
                    href="/needs"
                    label="Current Needs"
                    isActive={pathname === "/needs"}
                    onClick={() => handleNavClick("/needs")}
                  />
                  <MobileNavLink
                    href="/#impact"
                    label="Impact"
                    onClick={() => setIsOpen(false)}
                  />
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?tab=register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors touch-manipulation"
                  >
                    Become a Donor
                  </Link>
                  <Link
                    href="/login?tab=org-admin"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-bold text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                  >
                    Register Organization
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900">
                      {user.username}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {user.role === "ADMIN"
                        ? "System Admin"
                        : user.role === "ORG_ADMIN"
                          ? "Organization Admin"
                          : "Donor"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 touch-manipulation"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  isActive = false,
  onClick,
}: {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors touch-manipulation ${isActive
        ? "text-blue-600 bg-blue-50"
        : "text-slate-600 hover:bg-slate-50"
        }`}
    >
      {label}
    </Link>
  );
}
