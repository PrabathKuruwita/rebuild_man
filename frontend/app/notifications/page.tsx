"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";
import { useNotifications } from "@/lib/NotificationContext";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, Trash2, Inbox, ChevronRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function NotificationsPage() {
  const { authorized, isLoading } = useAuthGuard();
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedIdParam = searchParams.get("id");
  const selectedId = selectedIdParam ? parseInt(selectedIdParam, 10) : null;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "",
  });

  if (isLoading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  let filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  if (selectedId !== null) {
    filteredNotifications = notifications.filter(n => n.id === selectedId);
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PLEDGE_CREATED":
        return (
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
            <Bell size={18} />
          </div>
        );
      case "PLEDGE_CONFIRMED":
        return (
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <CheckCheck size={18} />
          </div>
        );
      case "PLEDGE_CANCELLED":
        return (
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
            <AlertCircle size={18} />
          </div>
        );
      case "PLEDGE_RECEIVED":
        return (
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100 shrink-0">
            <Inbox size={18} />
          </div>
        );
      case "ADMIN_APPROVAL_REQUEST":
        return (
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
            <Bell size={18} />
          </div>
        );
      case "REGISTRATION_DECISION":
        return (
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100 shrink-0">
            <CheckCheck size={18} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
            <Bell size={18} />
          </div>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="page-header-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Manage your platform alerts and updates.</p>
        </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: "Clear All Notifications",
                    message: "Are you sure you want to clear all notifications? This will permanently delete all records and cannot be undone.",
                    confirmText: "Clear All",
                    isDanger: true,
                    onConfirm: () => clearAll(),
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {selectedId !== null && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <span>Showing a single notification.</span>
            <button
              onClick={() => router.replace("/notifications")}
              className="font-bold hover:underline"
            >
              Show all notifications
            </button>
          </div>
        )}

        {/* Card Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-4 px-2 font-bold text-sm border-b-2 transition-all relative ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              All Notifications
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === "all" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
              }`}>
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`py-4 px-2 font-bold text-sm border-b-2 transition-all ml-6 relative ${
                activeTab === "unread"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List Content */}
          <div className="divide-y divide-slate-100">
            {notificationsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-base font-bold text-slate-900">No notifications here</p>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTab === "unread" ? "You have read all your notifications!" : "You will receive updates when important things happen."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-6 flex items-start gap-4 transition-all hover:bg-slate-50/50 group relative ${
                    !n.is_read ? "bg-blue-50/10" : ""
                  }`}
                >
                  {/* Indicator Dot */}
                  {!n.is_read && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}

                  {/* Icon */}
                  {getNotificationIcon(n.notification_type)}

                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className={`text-sm text-slate-900 leading-snug ${!n.is_read ? "font-bold" : "font-semibold"}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                    {/* Action Button */}
                    {n.action_url && (
                      <button
                        onClick={async () => {
                          if (!n.is_read) await markAsRead(n.id);
                          if (n.action_url) router.push(n.action_url);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View details
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>

                  {/* Context controls (mark read / delete) */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.is_read ? (
                      <button
                        onClick={() => markAsRead(n.id)}
                        title="Mark as read"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all animate-fade-in"
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <div className="p-2 text-slate-300">
                        <EyeOff size={16} />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Delete Notification",
                          message: "Are you sure you want to delete this notification? This action cannot be undone.",
                          confirmText: "Delete",
                          isDanger: true,
                          onConfirm: () => deleteNotification(n.id),
                        });
                      }}
                      title="Delete notification"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmModal.isDanger ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
              }`}>
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {confirmModal.title}
              </h3>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition ${
                  confirmModal.isDanger 
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
