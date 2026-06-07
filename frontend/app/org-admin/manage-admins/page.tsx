"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  getOrganizations,
  getOrgAdmins,
  inviteOrgAdmin,
  Organization,
  User,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Users, Mail, UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ManageAdminsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<User[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isInviting, setIsInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ORG_ADMIN") {
      router.push("/");
      return;
    }

    const fetchAdmins = async () => {
      try {
        // Find user's org
        const orgs = await getOrganizations();
        if (orgs && orgs.length > 0) {
          const userOrg = orgs[0];
          setOrg(userOrg);
          const adminsList = await getOrgAdmins(userOrg.id);
          setAdmins(adminsList);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load admins.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, [user, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setIsInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await inviteOrgAdmin(org.id, inviteData);
      setInviteSuccess("Admin invited successfully!");
      setInviteData({ username: "", email: "", password: "", first_name: "", last_name: "" });

      // Refresh list
      const adminsList = await getOrgAdmins(org.id);
      setAdmins(adminsList);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInviteError(err.message || "Failed to invite admin.");
      } else {
        setInviteError("Failed to invite admin.");
      }
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/org-admin"
            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 mb-2 font-medium text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-500" />
            Manage Organization Admins
          </h1>
          <p className="text-slate-500 mt-1">
            {org
              ? `Manage admins for ${org.name}`
              : "Invite additional administrators"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-2">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Admins List */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">
            Current Admins
          </h2>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                    {admin.first_name && admin.last_name ? (
                      `${admin.first_name.charAt(0).toUpperCase()}${admin.last_name.charAt(0).toUpperCase()}`
                    ) : (
                      admin.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      {admin.first_name || admin.last_name ? (
                        <>
                          {admin.first_name} {admin.last_name}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            ({admin.username})
                          </span>
                        </>
                      ) : (
                        admin.username
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{admin.email}</div>
                  </div>
                </div>
                {admin.id === user?.id && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                    You
                  </span>
                )}
              </div>
            ))}
            {admins.length === 0 && (
              <div className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                No admins found.
              </div>
            )}
          </div>
        </div>

        {/* Invite Form */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">
            Invite New Admin
          </h2>
          <form
            onSubmit={handleInvite}
            className="bg-white border md:col-span-1 border-slate-200 rounded-xl p-5 shadow-sm"
          >
            {inviteSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100">
                {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm border border-rose-100">
                {inviteError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteData.username}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, username: e.target.value })
                  }
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-slate-50 focus:bg-white"
                  placeholder="e.g. john_smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={inviteData.first_name}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, first_name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-slate-50 focus:bg-white"
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={inviteData.last_name}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, last_name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-slate-50 focus:bg-white"
                    placeholder="e.g. Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, email: e.target.value })
                    }
                    required
                    className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-slate-50 focus:bg-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={inviteData.password}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, password: e.target.value })
                    }
                    required
                    className="w-full pr-10 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-slate-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isInviting ? (
                  "Sending Invite..."
                ) : (
                  <>
                    <UserPlus size={18} />
                    Invite Admin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
