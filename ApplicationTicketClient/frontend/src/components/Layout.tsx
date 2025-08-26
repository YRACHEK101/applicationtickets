// client/components/Layout.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle,
  ChevronDown,
  FileText,
  TestTube2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import LanguageSelector from './LanguageSelector';
import api from '@/api/api';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  roles: string[];
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifRefresh, setNotifRefresh] = useState(0);
  
  const { notifications, loading, error } = useNotifications(4, notifRefresh);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [hasUnread, setHasUnread] = useState(unreadCount > 0);

  useEffect(() => {
    setHasUnread(unreadCount > 0);
  }, [unreadCount, user?.role]);

  const markSingleNotificationAsRead = async (notificationId: string) => {
    try {      
      await api.patch(`/v1/notifications/${notificationId}/read`);
      
      // Update local state to reflect the change immediately
      setNotifRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {      
      const response = await api.patch('/v1/notifications/read-all');
      
      setHasUnread(false);
      setNotifRefresh(prev => prev + 1);
      localStorage.setItem('lastReadTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show a user-friendly error message
      alert('Failed to mark notifications as read. Please try again.');
    }
  };

  // Check if RTL is needed
  const isRTL = i18n.language === 'ar';

  const menuItems: MenuItem[] = [
    {
      title: t('navigation.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/',
      roles: ['client', 'responsibleClient', 'agentCommercial', 'admin', 'projectManager', 'groupLeader', 'developer', 'responsibleTester', 'tester'],
    },
    {
      title: t('navigation.tickets'),
      icon: <Ticket className="h-5 w-5" />,
      href: '/tickets',
      roles: ['client', 'responsibleClient', 'agentCommercial', 'admin', 'groupLeader', 'projectManager', 'responsibleTester'],
    },
    {
      title: t('navigation.tasks'),
      icon: <FileText className="h-5 w-5" />,
      href: '/tasks',
      roles: ['admin', 'projectManager', 'groupLeader', 'developer', 'responsibleTester', 'tester'],
    },
    {
      title: user?.role === 'agentCommercial'
        ? t('navigation.clients')
        : user?.role === 'admin'
          ? t('navigation.users')
          : 'users',
      icon: <Users className="h-5 w-5" />,
      href: '/users',
      roles: ['admin', 'agentCommercial'],
    },
    {
      title: t('navigation.taskTests'),
      icon: <TestTube2 className="h-5 w-5" />,
      href: '/task-tests',
      roles: ['admin', 'responsibleTester'],
    },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`min-h-screen bg-gray-100 flex ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-64 bg-white shadow-md z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen
          ? 'translate-x-0'
          : isRTL
            ? 'translate-x-full'
            : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">{t('header.ticketSystem', 'Ticket System')}</span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={closeSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm rounded-md ${isRTL ? 'flex-row-reverse text-right' : ''} ${location.pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  onClick={closeSidebar}
                >
                  <span className={isRTL ? 'ml-3' : 'mr-3'}>{item.icon}</span>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-10">
          <button
            className={`text-gray-500 hover:text-gray-700 lg:hidden ${isRTL ? 'ml-4' : 'mr-4'}`}
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1"></div>

          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
            <LanguageSelector />

            {/* NOTIFICATION DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                >
                  <Bell className={`h-5 w-5 transition-colors duration-200 ${hasUnread ? 'text-orange-500' : 'text-gray-500'}`} />
                  {hasUnread && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                {/* Header with role info and mark all read button */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <div>
                    <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
                    <p className="text-xs text-gray-500 capitalize">{user?.role} notifications</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        createTestNotification();
                      }}
                    >
                      Test
                    </Button> */}
                    {hasUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllNotificationsAsRead();
                        }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 text-sm">{error}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setNotifRefresh(prev => prev + 1)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="divide-y">
                      {notifications.map(notif => (
                        <div
                          key={notif._id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.isRead) {
                              markSingleNotificationAsRead(notif._id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-3 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">{t('notifications.noNotifications')}</p>
                      <p className="text-xs text-gray-400 mt-1">Role: {user?.role}</p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => {
                        navigate('/notifications');
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(`${user?.firstName} ${user?.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`hidden md:block ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {t(`users.roles.${user?.role}`, user?.role)}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <DropdownMenuLabel>{t('auth.myAccount')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className={isRTL ? 'flex flex-row-reverse' : ''}>
                  <UserCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('auth.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')} className={isRTL ? 'flex flex-row-reverse' : ''}>
                  <Bell className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('navigation.notifications')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className={isRTL ? 'flex flex-row-reverse' : ''}>
                  <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}