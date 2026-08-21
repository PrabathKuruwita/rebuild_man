"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { registerOrgAdmin, getSystemStats } from "@/lib/api";
import {
  LogIn,
  HandHeart,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type Mode = "login" | "register" | "org-admin";

const modes: {
  id: Mode;
  label: string;
  icon: React.ElementType;
  tagline: string;
}[] = [
    { id: "login", label: "Sign In", icon: LogIn, tagline: "Already a member" },
    {
      id: "register",
      label: "Donor Register",
      icon: HandHeart,
      tagline: "Start giving today",
    },
    {
      id: "org-admin",
      label: "Organization Register",
      icon: Building2,
      tagline: "List your hospital",
    },
  ];

const ORG_TYPE_OPTIONS = [
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "SCHOOL", label: "School" },
  { value: "NGO", label: "NGO" },
  { value: "CHARITY", label: "Charity" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = "••••••••",
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        {...{ id }}
        type={show ? "text" : "password"}
        required
        placeholder={placeholder}
        className="form-input block w-full pl-9 pr-10 bg-white"
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const IconInput = ({
  id,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
}: {
  id: string;
  type?: string;
  placeholder: string;
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      id={id}
      type={type}
      required
      placeholder={placeholder}
      className="form-input block w-full pl-9 pr-3 bg-white"
      value={value}
      onChange={onChange}
    />
  </div>
);

export default function LoginContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const { login, register: authRegister } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [verifiedOrgsCount, setVerifiedOrgsCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getSystemStats();
        if (stats && typeof stats.verified_hospitals === "number") {
          setVerifiedOrgsCount(stats.verified_hospitals);
        }
      } catch (err) {
        console.warn("Failed to fetch system stats for login page:", err);
      }
    }
    loadStats();
  }, []);

  // Common form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register specific states
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Org Admin specific states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [selectedOrgType, setSelectedOrgType] = useState("");

  useEffect(() => {
    const tab = (searchParams.get("tab") as Mode) || "login";
    queueMicrotask(() => {
      setActiveTab(tab);
      setError(null);
    });
  }, [searchParams]);

  const handleTabChange = (tab: Mode) => {
    setActiveTab(tab);
    setError(null);
    // Reset form fields when switching tabs
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhoneNumber("");
    setFirstName("");
    setLastName("");
    setSelectedOrgName("");
    setSelectedOrgType("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "login") {
        await login(username, password);
      } else if (activeTab === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await authRegister({
          username,
          email,
          password,
          password2: confirmPassword,
          phone_number: phoneNumber,
          first_name: firstName,
          last_name: lastName,
        });
      } else if (activeTab === "org-admin") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!selectedOrgName.trim()) {
          throw new Error("Please select an organization");
        }
        if (!selectedOrgType.trim()) {
          throw new Error("Please select an organization type");
        }
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("Please enter your first and last name");
        }

        await registerOrgAdmin({
          username,
          email,
          password,
          password2: confirmPassword,
          phone_number: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          organization_name: selectedOrgName,
          organization_type: selectedOrgType,
        });
        alert(
          "Registration submitted! Awaiting system administrator approval.",
        );
        handleTabChange("login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
      <main className="relative flex-grow flex flex-col justify-center">
        {/* Decorative top background */}
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-100/60 to-transparent pointer-events-none" />

        <section className="container mx-auto px-4 relative py-12">
          {/* Header Text */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs font-medium text-gray-500 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              Secure access to Parithyaga
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-gray-900">
              Sign in or join the donation network
            </h1>
            <p className="mt-3 text-gray-500">
              Choose how you want to continue : Sign in to your account,
              Register as a donor or Register your organization.
            </p>
          </div>

          {/* Mode selector */}
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {modes.map((m) => {
                const Icon = m.icon;
                const active = activeTab === m.id;

                // Active colors based on tab
                let activeBorderColor = "border-primary";
                let activeBgColor = "bg-teal-50";
                let activeIconBg = "bg-primary";
                let activeCheckColor = "text-primary";

                if (m.id === "register") {
                  activeBorderColor = "border-sky-500";
                  activeBgColor = "bg-sky-50";
                  activeIconBg = "bg-sky-500";
                  activeCheckColor = "text-sky-500";
                } else if (m.id === "org-admin") {
                  activeBorderColor = "border-rose-500";
                  activeBgColor = "bg-rose-50";
                  activeIconBg = "bg-rose-500";
                  activeCheckColor = "text-rose-500";
                }

                return (
                  <button
                    key={m.id}
                    onClick={() => handleTabChange(m.id)}
                    className={`group flex items-center gap-3 rounded-none border p-4 text-left transition-all ${active
                        ? `${activeBorderColor} ${activeBgColor} shadow-sm`
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center transition-colors ${active
                          ? activeCheckColor
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">
                        {m.label}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {m.tagline}
                      </span>
                    </span>
                    {active && (
                      <CheckCircle2
                        className={`ml-auto h-4 w-4 shrink-0 ${activeCheckColor}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content grid */}
          <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Active Card Container */}
            <div className="w-full max-w-xl mx-auto lg:mx-0">
              <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                  {/* Common Error Display */}
                  {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error
                          </h3>
                          <div className="mt-1 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SignIn View */}
                  {activeTab === "login" && (
                    <>
                      <div className="mb-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-primary text-white shadow-sm">
                          <LogIn className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Welcome back
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Sign in to manage your donations and track impact.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Username
                          </label>
                          <IconInput
                            id="username"
                            placeholder="jane_doe"
                            icon={User}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Password
                            </label>
                            <Link
                              href="/forgot-password"
                              className="text-xs font-medium text-primary hover:text-teal-600"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <PasswordInput
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2 pb-2">
                          <input
                            id="remember"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor="remember"
                            className="text-sm text-gray-600"
                          >
                            Remember me
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn rounded-full bg-primary hover:bg-teal-700 text-white w-full flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-50"
                        >
                          {loading ? "Signing in..." : "Sign In"}{" "}
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <p className="text-center text-sm text-gray-500 pt-2">
                          New here?{" "}
                          <button
                            type="button"
                            onClick={() => handleTabChange("register")}
                            className="font-medium text-primary hover:underline"
                          >
                            Create an account
                          </button>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Donor Register View */}
                  {activeTab === "register" && (
                    <>
                      <div className="mb-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-sky-100 text-sky-500 shadow-sm">
                          <HandHeart className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Join as a Donor
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Create your free donor account and start contributing
                          to verified hospital needs.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="donorFirstName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Donor first name
                            </label>
                            <input
                              id="donorFirstName"
                              type="text"
                              required
                              placeholder="John"
                              className="form-input block w-full bg-white"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="donorLastName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Donor last name
                            </label>
                            <input
                              id="donorLastName"
                              type="text"
                              required
                              placeholder="Doe"
                              className="form-input block w-full bg-white"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="reg-username"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Donor username
                          </label>
                          <IconInput
                            id="reg-username"
                            placeholder="john_doe"
                            icon={User}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Email address
                          </label>
                          <IconInput
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            icon={Mail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone number
                          </label>
                          <IconInput
                            id="phone"
                            type="tel"
                            placeholder="+94 77 123 4567"
                            icon={Phone}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="reg-password"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Password
                            </label>
                            <PasswordInput
                              id="reg-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Confirm
                            </label>
                            <PasswordInput
                              id="confirmPassword"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-none bg-gray-50 p-3 border border-gray-100">
                          <input
                            id="terms"
                            type="checkbox"
                            required
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                          />
                          <label
                            htmlFor="terms"
                            className="text-xs text-gray-500 leading-relaxed"
                          >
                            I agree to NeedTracker&apos;s{" "}
                            <Link href="/terms" className="text-sky-600 hover:underline">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-sky-600 hover:underline">
                              Privacy Policy
                            </Link>
                            .
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/15 w-full flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-50"
                        >
                          {loading ? "Creating..." : "Create Donor Account"}{" "}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Org Admin Register View */}
                  {activeTab === "org-admin" && (
                    <>
                      <div className="mb-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-rose-100 text-rose-500 shadow-sm">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Register Your Organization
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          For Any organization that need Donations. Verification
                          required after submission.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="orgName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Organization name
                          </label>
                          <IconInput
                            id="orgName"
                            placeholder="National Hospital Colombo"
                            icon={Building2}
                            value={selectedOrgName}
                            onChange={(e) => setSelectedOrgName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="orgType"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Organization type
                          </label>
                          <select
                            id="orgType"
                            required
                            className="form-select block w-full bg-white text-gray-900"
                            value={selectedOrgType}
                            onChange={(e) => setSelectedOrgType(e.target.value)}
                          >
                            <option value="" disabled>
                              Select organization type
                            </option>
                            {ORG_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Admin first name
                            </label>
                            <input
                              id="firstName"
                              type="text"
                              required
                              placeholder="Jane"
                              className="form-input block w-full bg-white"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Admin last name
                            </label>
                            <input
                              id="lastName"
                              type="text"
                              required
                              placeholder="Smith"
                              className="form-input block w-full bg-white"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="orgUsername"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Admin username
                          </label>
                          <IconInput
                            id="orgUsername"
                            placeholder="jane_smith"
                            icon={User}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="orgEmail"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Official email
                            </label>
                            <IconInput
                              id="orgEmail"
                              type="email"
                              placeholder="admin@hospital.lk"
                              icon={Mail}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="orgPhone"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Phone
                            </label>
                            <IconInput
                              id="orgPhone"
                              type="tel"
                              placeholder="+94 11 269 1111"
                              icon={Phone}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="orgPassword"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Password
                            </label>
                            <PasswordInput
                              id="orgPassword"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="orgConfirm"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Confirm
                            </label>
                            <PasswordInput
                              id="orgConfirm"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-none bg-gray-50 p-3 border border-gray-100">
                          <input
                            id="org-terms"
                            type="checkbox"
                            required
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                          />
                          <label
                            htmlFor="org-terms"
                            className="text-xs text-gray-500 leading-relaxed"
                          >
                            I agree to Parithyaga&apos;s{" "}
                            <Link href="/terms" className="text-rose-600 hover:underline">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-rose-600 hover:underline">
                              Privacy Policy
                            </Link>
                            .
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/15 w-full flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-50 mt-2"
                        >
                          {loading
                            ? "Submitting..."
                            : "Submit for Verification"}{" "}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>

            {/* Trust Panel sidebar */}
            <aside className="rounded-none border border-gray-200 bg-white shadow-sm overflow-hidden sticky top-24 hidden lg:block">
              <div className="p-6">
                <h3 className="text-base font-semibold text-gray-900">
                  Why Parithyaga?
                </h3>
                <ul className="mt-4 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-600">
                      Verified organizations and transparent needs.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-600">
                      Real-time tracking of every donation.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-600">
                      Bank-level encryption for your data.
                    </span>
                  </li>
                </ul>
                <div className="mt-6 rounded-none bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Trusted by
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {verifiedOrgsCount !== null ? verifiedOrgsCount : "120"} organizations
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    across the country
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
