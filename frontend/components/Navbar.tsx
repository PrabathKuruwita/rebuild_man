'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { updateCurrentUser } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, setUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const panelRef = useRef<HTMLDivElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
  });
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', new_password2: '',
  });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Sync form when user loads or panel opens
  useEffect(() => {
    if (user && showProfile) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      });
      setPasswordForm({ current_password: '', new_password: '', new_password2: '' });
      setProfileError(null);
      setProfileSuccess(null);
      setActiveTab('info');
    }
  }, [showProfile, user]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    if (showProfile) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const updated = await updateCurrentUser(profileForm);
      setUser(updated);
      setProfileSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateCurrentUser(passwordForm);
      setPasswordForm({ current_password: '', new_password: '', new_password2: '' });
      setProfileSuccess('Password changed successfully.');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  const publicNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/needs', label: 'Current Needs' },
  ];

  const navLinks = isAdmin
    ? [
        { href: '/', label: 'Dashboard' },
        { href: '/organizations', label: 'Organizations' },
        { href: '/needs', label: 'All Needs' },
        { href: '/documents', label: 'Documents' },
      ]
    : [
        { href: '/', label: 'Dashboard' },
        { href: '/needs', label: 'Current Needs' },
      ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-bold text-xl text-gray-900">NeedTracker</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:flex sm:space-x-4">
              {(user ? navLinks : publicNavLinks).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
             {!user ? (
               <div className="flex items-center gap-2">
                 <Link
                   href="/login"
                   className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                 >
                   Sign In
                 </Link>
                 <Link
                   href="/login?tab=register"
                   className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                 >
                   Register as Donor
                 </Link>
               </div>
             ) : user ? (
               <>
                 <span className="hidden md:inline-flex text-sm font-medium text-gray-700 items-center">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {user.role}
                    </span>
                 </span>
                 <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                 >
                   Sign out
                 </button>
                 {/* Avatar button */}
                 <div className="relative" ref={panelRef}>
                   <button
                     onClick={() => setShowProfile(v => !v)}
                     className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                   >
                     {user.username.charAt(0).toUpperCase()}
                   </button>

                   {/* Profile panel */}
                   {showProfile && (
                     <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                       {/* Header */}
                       <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                             {user.username.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="text-white font-semibold">
                               {user.first_name && user.last_name
                                 ? `${user.first_name} ${user.last_name}`
                                 : user.username}
                             </p>
                             <p className="text-indigo-200 text-xs">{user.email || 'No email set'}</p>
                           </div>
                         </div>
                       </div>

                       {/* Tabs */}
                       <div className="flex border-b border-gray-100">
                         <button
                           onClick={() => { setActiveTab('info'); setProfileError(null); setProfileSuccess(null); }}
                           className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                           Profile
                         </button>
                         <button
                           onClick={() => { setActiveTab('password'); setProfileError(null); setProfileSuccess(null); }}
                           className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                           Password
                         </button>
                       </div>

                       <div className="p-4">
                         {/* Feedback */}
                         {profileSuccess && (
                           <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                             {profileSuccess}
                           </div>
                         )}
                         {profileError && (
                           <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                             {profileError}
                           </div>
                         )}

                         {activeTab === 'info' ? (
                           <form onSubmit={handleProfileSave} className="space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                               <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                                 <input
                                   type="text"
                                   value={profileForm.first_name}
                                   onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                                   className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="First"
                                 />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                                 <input
                                   type="text"
                                   value={profileForm.last_name}
                                   onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                                   className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Last"
                                 />
                               </div>
                             </div>
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                               <input
                                 type="email"
                                 value={profileForm.email}
                                 onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                 className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="email@example.com"
                               />
                             </div>
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                               <input
                                 type="tel"
                                 value={profileForm.phone_number}
                                 onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                                 className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="+94 77 000 0000"
                               />
                             </div>
                             {/* Read-only info */}
                             <div className="pt-1 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                               <p><span className="font-medium text-gray-500">Username:</span> {user.username}</p>
                               <p><span className="font-medium text-gray-500">Role:</span> {user.role}</p>
                             </div>
                             <button
                               type="submit"
                               disabled={saving}
                               className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                             >
                               {saving ? 'Saving...' : 'Save Changes'}
                             </button>
                           </form>
                         ) : (
                           <form onSubmit={handlePasswordSave} className="space-y-3">
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                               <input
                                 type="password"
                                 required
                                 value={passwordForm.current_password}
                                 onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                                 className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="••••••••"
                               />
                             </div>
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                               <input
                                 type="password"
                                 required
                                 value={passwordForm.new_password}
                                 onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                                 className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="••••••••"
                               />
                             </div>
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                               <input
                                 type="password"
                                 required
                                 value={passwordForm.new_password2}
                                 onChange={e => setPasswordForm(p => ({ ...p, new_password2: e.target.value }))}
                                 className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="••••••••"
                               />
                             </div>
                             <button
                               type="submit"
                               disabled={saving}
                               className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                             >
                               {saving ? 'Saving...' : 'Change Password'}
                             </button>
                           </form>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               </>
             ) : (
                <div className="w-8 h-8"></div>
             )}
          </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="flex overflow-x-auto px-4 py-2 gap-2">
          {(user ? navLinks : publicNavLinks).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
