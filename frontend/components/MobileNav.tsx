"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  HeartHandshake,
  FileText,
  List,
  Users,
  Building2,
  UserCheck,
  Home,
  Sparkles,
  Info,
  PhoneCall,
  UserCircle,
  LogOut,
} from "lucide-react";

export default function MobileNav({ isSolid = true }: { isSolid?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const isProfileTab = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange);
      return () => window.removeEventListener("popstate", onStoreChange);
    },
    () => new URLSearchParams(window.location.search).get("profile") === "true",
    () => false,
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on navigation
  const handleNavClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Lock body scroll and support Escape key when menu is open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="xl:hidden" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors touch-manipulation cursor-pointer ${
          isSolid
            ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            : "text-slate-200 hover:text-white hover:bg-white/10"
        }`}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu rendered via Portal into document.body to prevent parent offset or transform clipping */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="xl:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] animate-in fade-in duration-150"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Centered Modal Card Container */}
            <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center pt-16 sm:pt-20 px-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
                {/* Top Right Close (X) Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors z-30 touch-manipulation cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>

                <div className="max-h-[80vh] overflow-y-auto">
                  {/* Navigation Links */}
                  <nav className="flex flex-col py-3 px-2 space-y-0.5">
                    {/* Organization Admin Menu */}
                    {user?.role === "ORG_ADMIN" && (
                      <>
                        <div className="px-3 pt-1 pb-1.5 pr-12">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Organization Admin Console
                          </span>
                        </div>
                        <MobileNavLink
                          href="/org-admin"
                          label="Dashboard"
                          icon={<LayoutDashboard size={18} />}
                          isActive={pathname === "/org-admin"}
                          onClick={() => handleNavClick("/org-admin")}
                        />
                        <MobileNavLink
                          href="/organizations#sections-needs"
                          label="Manage Needs"
                          icon={<ClipboardList size={18} />}
                          isActive={
                            pathname === "/organizations" && !isProfileTab
                          }
                          onClick={() =>
                            handleNavClick("/organizations#sections-needs")
                          }
                        />
                        <MobileNavLink
                          href="/admin/donations"
                          label="Track Donations"
                          icon={<HeartHandshake size={18} />}
                          isActive={pathname.startsWith("/admin/donations")}
                          onClick={() => handleNavClick("/admin/donations")}
                        />
                        <MobileNavLink
                          href="/documents"
                          label="AI Uploads"
                          icon={<FileText size={18} />}
                          isActive={pathname === "/documents"}
                          onClick={() => handleNavClick("/documents")}
                        />
                        <MobileNavLink
                          href="/needs"
                          label="All Needs"
                          icon={<List size={18} />}
                          isActive={pathname === "/needs"}
                          onClick={() => handleNavClick("/needs")}
                        />
                        <MobileNavLink
                          href="/org-admin/manage-admins"
                          label="Manage Admins"
                          icon={<Users size={18} />}
                          isActive={pathname === "/org-admin/manage-admins"}
                          onClick={() =>
                            handleNavClick("/org-admin/manage-admins")
                          }
                        />
                        <MobileNavLink
                          href="/organizations?profile=true"
                          label="Organization Profile"
                          icon={<Building2 size={18} />}
                          isActive={
                            (pathname === "/organizations" && isProfileTab) ||
                            (pathname.startsWith("/organizations/") &&
                              pathname.endsWith("/edit"))
                          }
                          onClick={() =>
                            handleNavClick("/organizations?profile=true")
                          }
                        />
                      </>
                    )}

                    {/* System Admin Menu */}
                    {user?.role === "ADMIN" && (
                      <>
                        <div className="px-3 pt-1 pb-1.5 pr-12">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            System Admin Console
                          </span>
                        </div>
                        <MobileNavLink
                          href="/admin"
                          label="Dashboard"
                          icon={<LayoutDashboard size={18} />}
                          isActive={pathname === "/admin"}
                          onClick={() => handleNavClick("/admin")}
                        />
                        <MobileNavLink
                          href="/organizations"
                          label="Manage Organizations"
                          icon={<Building2 size={18} />}
                          isActive={pathname === "/organizations"}
                          onClick={() => handleNavClick("/organizations")}
                        />
                        <MobileNavLink
                          href="/admin/approvals"
                          label="Manage Approvals"
                          icon={<UserCheck size={18} />}
                          isActive={pathname.startsWith("/admin/approvals")}
                          onClick={() => handleNavClick("/admin/approvals")}
                        />
                        <MobileNavLink
                          href="/needs"
                          label="All Needs"
                          icon={<List size={18} />}
                          isActive={pathname === "/needs"}
                          onClick={() => handleNavClick("/needs")}
                        />
                        <MobileNavLink
                          href="/admin/donors"
                          label="View Donors"
                          icon={<Users size={18} />}
                          isActive={pathname.startsWith("/admin/donors")}
                          onClick={() => handleNavClick("/admin/donors")}
                        />
                        <MobileNavLink
                          href="/documents"
                          label="AI Uploads"
                          icon={<FileText size={18} />}
                          isActive={pathname === "/documents"}
                          onClick={() => handleNavClick("/documents")}
                        />
                      </>
                    )}

                    {/* Authenticated Donor Menu */}
                    {user &&
                      user.role !== "ADMIN" &&
                      user.role !== "ORG_ADMIN" && (
                        <>
                          <div className="px-3 pt-1 pb-1.5 pr-12">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Donor Navigation
                            </span>
                          </div>
                          <MobileNavLink
                            href="/"
                            label="Dashboard"
                            icon={<LayoutDashboard size={18} />}
                            isActive={pathname === "/"}
                            onClick={() => handleNavClick("/")}
                          />
                          <MobileNavLink
                            href="/needs"
                            label="Current Needs"
                            icon={<ClipboardList size={18} />}
                            isActive={pathname === "/needs"}
                            onClick={() => handleNavClick("/needs")}
                          />
                          <MobileNavLink
                            href="/impact"
                            label="Our Impact"
                            icon={<Sparkles size={18} />}
                            isActive={pathname === "/impact"}
                            onClick={() => handleNavClick("/impact")}
                          />
                          <MobileNavLink
                            href="/about"
                            label="About Us"
                            icon={<Info size={18} />}
                            isActive={pathname === "/about"}
                            onClick={() => handleNavClick("/about")}
                          />
                          <MobileNavLink
                            href="/contact"
                            label="Contact Us"
                            icon={<PhoneCall size={18} />}
                            isActive={pathname === "/contact"}
                            onClick={() => handleNavClick("/contact")}
                          />
                        </>
                      )}

                    {/* Unauthenticated Menu */}
                    {!user && (
                      <>
                        <div className="px-3 pt-1 pb-1.5 pr-12">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Navigation
                          </span>
                        </div>
                        <MobileNavLink
                          href="/"
                          label="Home"
                          icon={<Home size={18} />}
                          isActive={pathname === "/"}
                          onClick={() => handleNavClick("/")}
                        />
                        <MobileNavLink
                          href="/needs"
                          label="Current Needs"
                          icon={<ClipboardList size={18} />}
                          isActive={pathname === "/needs"}
                          onClick={() => handleNavClick("/needs")}
                        />
                        <MobileNavLink
                          href="/impact"
                          label="Our Impact"
                          icon={<Sparkles size={18} />}
                          isActive={pathname === "/impact"}
                          onClick={() => handleNavClick("/impact")}
                        />
                        <MobileNavLink
                          href="/about"
                          label="About Us"
                          icon={<Info size={18} />}
                          isActive={pathname === "/about"}
                          onClick={() => handleNavClick("/about")}
                        />
                        <MobileNavLink
                          href="/contact"
                          label="Contact Us"
                          icon={<PhoneCall size={18} />}
                          isActive={pathname === "/contact"}
                          onClick={() => handleNavClick("/contact")}
                        />
                      </>
                    )}
                  </nav>

                  {/* Auth Section */}
                  <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
                    {!user ? (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setIsOpen(false)}
                          className="block w-full px-4 py-2.5 text-center text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors touch-manipulation shadow-xs"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/login?tab=register"
                          onClick={() => setIsOpen(false)}
                          className="relative group/mobile-donor block w-full px-4 py-3 text-center text-sm font-bold text-white rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 shadow-[0_4px_20px_rgba(13,148,136,0.4)] ring-1 ring-emerald-400/30 touch-manipulation"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 bg-[length:200%_auto] animate-gradient-shift"></span>
                          <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 translate-x-[-150%] animate-btn-shimmer pointer-events-none"></span>
                          <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-xs">
                            Become a Donor
                          </span>
                        </Link>
                        <Link
                          href="/login?tab=org-admin"
                          onClick={() => setIsOpen(false)}
                          className="block w-full px-4 py-2.5 text-center text-sm font-bold text-primary bg-white border-2 border-primary hover:bg-teal-50 rounded-xl transition-colors touch-manipulation"
                        >
                          Register Organization
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl shadow-xs">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {user.role === "ADMIN"
                              ? "System Admin"
                              : user.role === "ORG_ADMIN"
                                ? "Organization Admin"
                                : "Donor"}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="w-full px-4 py-2.5 text-center text-sm font-semibold text-primary bg-white border border-primary hover:bg-teal-50 rounded-xl transition-colors touch-manipulation inline-flex items-center justify-center gap-2"
                        >
                          <UserCircle size={16} />
                          <span>My Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-2.5 text-sm font-semibold text-rose-600 bg-white hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 touch-manipulation inline-flex items-center justify-center gap-2"
                        >
                          <LogOut size={16} />
                          <span>Sign out</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  icon,
  isActive = false,
  onClick,
}: {
  href: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 touch-manipulation flex items-center gap-3 ${
        isActive
          ? "text-primary bg-primary/10 font-bold"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon && (
        <span
          className={`shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`}
        >
          {icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}
