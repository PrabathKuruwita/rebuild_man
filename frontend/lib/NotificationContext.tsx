'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  Notification, 
  getNotifications, 
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDelete,
  clearAllNotifications as apiClearAll
} from './api';

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Initial load and periodic polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    refresh().finally(() => setLoading(false));

    // Poll every 15 seconds to fetch new notifications
    const interval = setInterval(() => {
      refresh();
    }, 15000);

    return () => clearInterval(interval);
  }, [user, refresh]);

  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await apiMarkAsRead(id);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      // Revert if error
      refresh();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      await apiMarkAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      refresh();
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      // Optimistic update
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      await apiDelete(id);
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
      refresh();
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      
      await apiClearAll();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      refresh();
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
