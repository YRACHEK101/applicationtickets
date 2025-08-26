// client/hooks/useNotifications.js
import { useEffect, useState, useCallback } from "react";
import api from '@/api/api';
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
}

export function useNotifications(limit?: number, refreshTrigger?: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/v1/notifications/unread');
      
      const notifications = response.data.map((n: Notification) => ({
        ...n,
        isRead: false,
        userId: user.id,
      }));

      const sorted = notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const limitedNotifications = limit ? sorted.slice(0, limit) : sorted;
      
      setNotifications(limitedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
      
      // Check if it's a permission error
      if (error.response?.status === 403) {
        console.error('Permission denied for notifications - check backend role permissions');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshTrigger]);

  return { notifications, loading, error, refetch: fetchNotifications };
}