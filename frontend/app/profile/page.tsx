"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { updateCurrentUser } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { User, Mail, Phone, Lock, UserCircle, Save } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Teal Header Section - Matches Theme */}
      <div className="bg-gradient-to-r from-primary to-teal-800 text-white pt-16 pb-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-4">
                User Profile
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                {user.username}
              </h1>
              <p className="text-teal-100 mt-2 text-sm max-w-xl">
                Manage your personal information and account security settings.
                Current login session is active.
              </p>
            </div>
            <Link
              href={
                user.role === "ADMIN"
                  ? "/admin"
                  : user.role === "ORG_ADMIN"
                    ? "/org-admin"
                    : "/"
              }
              className="bg-white text-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-50 transition-all"
            >
              {user.role === "ADMIN" || user.role === "ORG_ADMIN"
                ? "Back to Dashboard"
                : "Back to Home"}
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Content - Matches two-column layout in Image 2 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <ProfileFormContent
          key={user.id || user.email}
          user={user}
          setUser={setUser}
        />
      </div>
    </div>
  );
}

interface ProfileFormContentProps {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  setUser: ReturnType<typeof useAuth>["setUser"];
}

function ProfileFormContent({ user, setUser }: ProfileFormContentProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone_number: user.phone_number || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password2: "",
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateCurrentUser(profileForm);
      setUser(updated);
      setMessage("Profile updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateCurrentUser(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password2: "",
      });
      setMessage("Password changed successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <UserCircle size={20} className="text-emerald-500" />
          <span className="text-sm font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Lock size={20} className="text-rose-500" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Details Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Profile details
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Your basic account information
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
                >
                  First Name
                </label>
                <input
                  id="first_name"
                  title="First Name"
                  placeholder="First Name"
                  value={profileForm.first_name}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      first_name: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
                >
                  Last Name
                </label>
                <input
                  id="last_name"
                  title="Last Name"
                  placeholder="Last Name"
                  value={profileForm.last_name}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      last_name: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="email"
                  title="Email"
                  placeholder="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="phone_number"
                  title="Phone Number"
                  placeholder="Phone Number"
                  value={profileForm.phone_number}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      phone_number: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? "Saving changes..." : "Save details"}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
              <Lock className="text-rose-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Change password
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Keep your account secure
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSave} className="space-y-6">
            <div>
              <label
                htmlFor="current_password"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
              >
                Current password
              </label>
              <input
                id="current_password"
                title="Current Password"
                placeholder="Current password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    current_password: e.target.value,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="new_password"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
              >
                New password
              </label>
              <input
                id="new_password"
                title="New Password"
                placeholder="New password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    new_password: e.target.value,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
              >
                Confirm new password
              </label>
              <input
                id="confirm_password"
                title="Confirm new password"
                placeholder="Confirm new password"
                type="password"
                value={passwordForm.new_password2}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    new_password2: e.target.value,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-bold hover:bg-slate-800 transition-all"
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
