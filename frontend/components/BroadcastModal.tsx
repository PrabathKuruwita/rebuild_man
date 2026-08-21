"use client";

import React, { useState } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { sendBroadcastNotification } from '@/lib/api';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const [audience, setAudience] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await sendBroadcastNotification({ audience, title, message });
      setSuccess(response.status || 'Broadcast sent successfully!');
      setTimeout(() => {
        onClose();
        setTitle('');
        setMessage('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
            <Send size={20} className="text-primary" />
            Send Broadcast Notification
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-label font-bold text-slate-700 mb-2">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-slate-200 shadow-sm focus:border-primary focus:ring-primary text-sm font-body"
            >
              <option value="ALL">All Registered Users</option>
              <option value="ORG_ADMIN">Only Organization Admins</option>
              <option value="DONOR">Only Registered Donors</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-label font-bold text-slate-700 mb-2">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Maintenance Notice"
              className="w-full px-4 py-2.5 rounded-lg border-slate-200 shadow-sm focus:border-primary focus:ring-primary text-sm font-body"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-label font-bold text-slate-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your broadcast message here..."
              className="w-full px-4 py-2.5 rounded-lg border-slate-200 shadow-sm focus:border-primary focus:ring-primary text-sm font-body resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={16} /> Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
