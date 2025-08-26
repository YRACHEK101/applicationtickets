// src/components/NotificationCenter.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from './ui/use-toast';
import api from '../api/api';

interface Notification {
  _id: string;
  message: string;
  relatedTo: {
    _id: string;
    number?: string;
    title?: string;
    name?: string;
  };
  notificationModel: 'Ticket' | 'Task' | 'User';
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  
  // Load notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);
  
  // Check for unread notifications periodically
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Set up interval (every 2 minutes)
    const interval = setInterval(fetchUnreadCount, 120000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/auth/me');
      setUnreadCount(response.data.unreadNotificationsCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  const fetchNotifications = async () => {
    setLoading(true);
    
    try {
      const response = await api.get('/auth/notifications');
      setNotifications(response.data);
      
      // Update unread count
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: t('error'),
        description: t('notifications.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/auth/notifications/${notificationId}`);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Decrease unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.isRead).length === 0) return;
    
    setMarkingAllAsRead(true);
    
    try {
      // In a real application, you would have a dedicated endpoint for this
      // Here we'll mark them one by one
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await api.put(`/auth/notifications/${notification._id}`);
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      toast({
        title: t('success'),
        description: t('notifications.markedAllAsRead'),
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: t('error'),
        description: t('notifications.markAllError'),
        variant: 'destructive',
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to related entity
    if (notification.relatedTo) {
      // Close popover
      setIsOpen(false);
      
      // Navigate based on entity type
      switch (notification.notificationModel) {
        case 'Ticket':
          navigate(`/tickets/${notification.relatedTo._id}`);
          break;
        case 'Task':
          navigate(`/tasks/${notification.relatedTo._id}`);
          break;
        case 'User':
          // Typically not navigable
          break;
      }
    }
  };
  
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? t('time.minuteAgo') : t('time.minutesAgo')}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? t('time.hourAgo') : t('time.hoursAgo')}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? t('time.dayAgo') : t('time.daysAgo')}`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={markingAllAsRead}
            >
              {markingAllAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('notifications.markAllAsRead')}
                </>
              )}
            </Button>
          )}
        </div>
        
        <Separator className="my-2" />
        
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-3">
              {notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`
                    p-2 rounded-md cursor-pointer
                    ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}
                    hover:bg-gray-100
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm ${notification.isRead ? 'font-normal' : 'font-medium'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        
                        {/* Entity reference */}
                        {notification.relatedTo && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded ml-2">
                            {notification.notificationModel === 'Ticket' && '#' + (notification.relatedTo.number || notification.relatedTo._id.substring(0, 8))}
                            {notification.notificationModel === 'Task' && notification.relatedTo.name || notification.relatedTo._id.substring(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Mark as read button - only for unread notifications */}
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}