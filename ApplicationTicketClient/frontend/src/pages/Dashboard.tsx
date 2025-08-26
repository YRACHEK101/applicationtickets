import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import TicketService from '../api/TicketService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Activity,
  Users,
  Bell,
  Briefcase,
  CalendarClock,
  LineChart
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import LanguageSelector from '../components/LanguageSelector';

// Interface for activity items
interface ActivityItem {
  type: string;
  description?: string;
  date: string;
  ticketTitle?: string;
  ticketId?: string;
  author?: string;
  metadata?: {
    [key: string]: any;
  };
}

// Interface for ticket data
interface Ticket {
  _id: string;
  title: string;
  number?: string;
  application: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  urgency: string;
}

// Interface for dashboard statistics
interface DashboardStats {
  openTickets: number;
  closedTickets: number;
  urgentTickets?: number;
  pendingValidation?: number;
  assignedInterventions?: number;
  pendingAction?: number;
  totalTickets?: number;
}

export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    closedTickets: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  // Check if RTL is needed
  const isRTL = i18n.language === 'ar';

  // Fetch dashboard data when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      // Get ticket statistics
      try {
        const statsData = await TicketService.getTicketStats();
        setStats(statsData);
      } catch (statsError) {
        console.error('Failed to fetch stats:', statsError);
      }

      // Get recent activity
      try {
        const activityData = await TicketService.getRecentActivity();
        setRecentActivity(activityData || []);
      } catch (activityError) {
        console.log('Recent activity not available or error occurred:', activityError);
        setRecentActivity([]);
      }

      // Get recent tickets based on user role
      try {
        let ticketsData: Ticket[] = [];

        if (user?.role === 'client') {
          ticketsData = await TicketService.getClientTickets();
        } else if (user?.role === 'responsibleClient') {
          ticketsData = await TicketService.getResponsibleTickets();
        } else if (user?.role === 'agentCommercial') {
          ticketsData = await TicketService.getAgentTickets();
        } else if (user?.role === 'groupLeader') {
          ticketsData = await TicketService.getGroupLeaderTickets();
        } else if (user?.role === 'projectManager') {
          ticketsData = await TicketService.getProjectManagerTickets();
        } else if (user?.role === 'responsibleTester') {
          ticketsData = await TicketService.getResponsibleTesterTickets();
        } else {
          ticketsData = await TicketService.getAllTickets();
        }

        // Sort by date and take only 5 most recent tickets
        const sortedTickets = ticketsData
          .sort((a: Ticket, b: Ticket) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        setRecentTickets(sortedTickets);
      } catch (ticketsError) {
        console.error('Failed to fetch tickets:', ticketsError);
        setRecentTickets([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to create ticket page
  const handleCreateTicket = (): void => {
    navigate('/tickets/create');
  };

  // Handle navigation to tickets list
  const handleViewTickets = (): void => {
    navigate('/tickets');
  };

  // Get activity type translation and icon
  const getActivityTypeDisplay = (type: string) => {
    const typeMap = {
      'ticket_created': t('dashboard.activity.ticketCreated'),
      'status_change': t('dashboard.activity.statusChanged'),
      'comment_added': t('dashboard.activity.commentAdded'),
      'meeting_scheduled': t('dashboard.activity.meetingScheduled'),
      'intervention_started': t('dashboard.activity.interventionStarted'),
      'blocker_added': t('dashboard.activity.blockerAdded'),
      'blocker_resolved': t('dashboard.activity.blockerResolved')
    };

    return typeMap[type] || type.replace(/_/g, ' ');
  };

  // Recent activity item renderer
  // Recent activity item renderer
  const renderActivityItem = (activity: ActivityItem, index: number): JSX.Element | null => {
    if (!activity) return null;

    // Function to truncate text with ellipsis
    const truncateText = (text: string, maxLength: number = 100): string => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    return (
      <div key={index} className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} border-b border-gray-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0`}>
        <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
          {activity.type === 'ticket_created' && <Plus className="h-4 w-4 text-blue-600" />}
          {activity.type === 'status_change' && <RefreshCw className="h-4 w-4 text-blue-600" />}
          {activity.type === 'comment_added' && <FileText className="h-4 w-4 text-blue-600" />}
          {activity.type === 'meeting_scheduled' && <CalendarClock className="h-4 w-4 text-blue-600" />}
          {activity.type === 'intervention_started' && <Activity className="h-4 w-4 text-blue-600" />}
          {activity.type === 'blocker_added' && <AlertCircle className="h-4 w-4 text-blue-600" />}
          {activity.type === 'blocker_resolved' && <CheckCircle className="h-4 w-4 text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className="text-sm font-medium text-gray-900 break-words"
            title={activity.description || getActivityTypeDisplay(activity.type)} // Show full text on hover
          >
            {truncateText(activity.description || getActivityTypeDisplay(activity.type), 80)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(activity.date).toLocaleString(i18n.language)}
          </p>
          {activity.ticketTitle && (
            <p
              className="text-xs text-gray-600 mt-1"
              title={activity.ticketTitle} // Show full title on hover
            >
              <span className="font-medium">{t('tickets.title')}:</span> {truncateText(activity.ticketTitle, 40)}
            </p>
          )}
          {activity.author && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">{t('common.by')}:</span> {truncateText(activity.author, 20)}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Role-specific actions for quick actions card
  const renderRoleSpecificActions = (): JSX.Element | null => {
    switch (user?.role) {
      case 'admin':
        return (
          <>
            <Button
              className={`w-full flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
              onClick={() => navigate('/users')}
            >
              <Users className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('users.title')}
            </Button>
            <Button
              className={`w-full flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
              variant="outline"
              onClick={() => navigate('/tasks?status=Blocked')}
            >
              <AlertCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('tasks.blockers')}
            </Button>
          </>
        );
      case 'responsibleClient':
        return (
          <>
            {/* Add specific actions for responsible client if needed */}
          </>
        );
      case 'agentCommercial':
        return (
          <>
            {/* Add specific actions for commercial agent if needed */}
          </>
        );
      default:
        return null;
    }
  };

  // Render role-specific stats
  const renderRoleSpecificStats = (): JSX.Element | null => {
    switch (user?.role) {
      case 'admin':
      case 'responsibleClient':
        return (
          <>
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.urgentTickets')}</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-amber-600">{stats.urgentTickets || 0}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.pendingValidation')}</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-purple-600">{stats.pendingValidation || 0}</p>
              )}
            </div>
          </>
        );
      case 'agentCommercial':
        return (
          <>
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.assignedInterventions')}</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-blue-600">{stats.assignedInterventions || 0}</p>
              )}
            </div>
          </>
        );
      case 'client':
        return (
          <>
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.pendingAction')}</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-amber-600">{stats.pendingAction || 0}</p>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Registered':
        return 'bg-gray-200 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'TechnicalValidation':
        return 'bg-orange-100 text-orange-800';
      case 'Revision':
        return 'bg-purple-100 text-purple-800';
      case 'ClientValidation':
        return 'bg-indigo-100 text-indigo-800';
      case 'Validated':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render recent tickets
  const renderRecentTickets = (): JSX.Element | JSX.Element[] => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (recentTickets.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">{t('tickets.noTicketsFound')}</p>
          <p className="text-sm text-gray-400 mb-4">{t('dashboard.noTicketsDescription')}</p>
          {(user?.role === 'client' || user?.role === 'admin' || user?.role === 'agentCommercial') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTicket}
              className={`${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('tickets.createTicket')}
            </Button>
          )}
        </div>
      );
    }

    // Function to truncate text with ellipsis
    const truncateText = (text: string, maxLength: number = 80): string => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    return (
      <div className="space-y-0">
        {recentTickets.map((ticket: Ticket, index: number) => (
          <div
            key={ticket._id}
            className={`py-4 ${index !== recentTickets.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors cursor-pointer rounded-lg px-2 -mx-2`}
            onClick={() => navigate(`/tickets/${ticket._id}`)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4
                className="text-sm font-medium text-gray-900 flex-1 pr-4 break-words overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis'
                }}
                title={ticket.title}
              >
                {ticket.title}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">
                {new Date(ticket.updatedAt).toLocaleDateString(i18n.language)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-xs text-gray-600 flex-1 min-w-0 overflow-hidden">
                <span className="flex-shrink-0">{truncateText(ticket.application, 15)}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">#{ticket.number || ticket._id.substring(0, 8)}</span>
                {ticket.urgency && ticket.urgency !== 'Low' && (
                  <>
                    <span className="flex-shrink-0">•</span>
                    <span className={`font-medium flex-shrink-0 ${ticket.urgency === 'High' ? 'text-red-600' :
                      ticket.urgency === 'Medium' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                      {t(`tickets.urgency.${ticket.urgency.toLowerCase()}`)}
                    </span>
                  </>
                )}
              </div>
              <Badge className={`${getStatusBadgeClass(ticket.status)} text-xs ml-2 flex-shrink-0 whitespace-nowrap`}>
                {t(`tickets.status.${ticket.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('dashboard.welcome')}, {user?.firstName}!
        </h1>

        {/* Dashboard greeting with role */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {user?.role === 'admin' && t('users.roles.admin') + ' ' + t('dashboard.title')}
                {user?.role === 'client' && t('users.roles.client') + ' ' + t('dashboard.title')}
                {user?.role === 'responsibleClient' && t('users.roles.responsibleClient') + ' ' + t('dashboard.title')}
                {user?.role === 'agentCommercial' && t('users.roles.agent') + ' ' + t('dashboard.title')}
                {user?.role === 'commercial' && t('users.roles.commercial') + ' ' + t('dashboard.title')}
                {user?.role === 'tester' && t('users.roles.tester') + ' ' + t('dashboard.title')}
                {user?.role === 'responsibleTester' && t('users.roles.responsibleTester') + ' ' + t('dashboard.title')}
              </h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`mt-4 md:mt-0 ${isRTL ? 'flex flex-row-reverse' : ''}`}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Notification banner for urgent items (conditional) */}
        {!loading && ((stats.urgentTickets && stats.urgentTickets > 0 && (user?.role === 'admin' || user?.role === 'responsibleClient')) ||
          (stats.pendingAction && stats.pendingAction > 0 && user?.role === 'client')) && (
            <div className={`bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Bell className={`h-5 w-5 text-amber-500 ${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0`} />
              <div>
                <h3 className="font-medium text-amber-800">
                  {user?.role === 'admin' || user?.role === 'responsibleClient'
                    ? `${t('dashboard.urgentTickets')}: ${stats.urgentTickets}`
                    : `${t('dashboard.pendingAction')}: ${stats.pendingAction}`
                  }
                </h3>
                <p className="text-sm text-amber-700">
                  {user?.role === 'admin' || user?.role === 'responsibleClient'
                    ? t('dashboard.urgentTicketsDescription')
                    : t('dashboard.pendingActionDescription')
                  }
                </p>
              </div>
            </div>
          )}

        {!['developer', 'tester'].includes(user?.role) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Activity className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600`} />
                  {t('dashboard.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Client can create ticket */}
                  {(user?.role === 'admin' || user?.role === 'agentCommercial') && (
                    <Button
                      className={`w-full flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
                      onClick={handleCreateTicket}
                    >
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('tickets.createTicket')}
                    </Button>
                  )}

                  {/* All roles can view tickets */}
                  <Button
                    className={`w-full flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
                    variant="outline"
                    onClick={handleViewTickets}
                  >
                    <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('common.view')} {user?.role === 'client' ? t('common.my') : ''} {t('tickets.title')}
                  </Button>

                  {/* Role-specific actions */}
                  {renderRoleSpecificActions()}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600`} />
                  {t('dashboard.recentActivity')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.recentActivityDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {loading ? (
                    <>
                      {[1, 2, 3].map((item) => (
                        <div key={item} className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} pb-3`}>
                          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, index) => renderActivityItem(activity, index))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t('dashboard.noRecentActivity')}</p>
                      <p className="text-sm text-gray-400 mt-1">{t('dashboard.noRecentActivityDescription')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LineChart className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600`} />
                  {t('dashboard.statistics')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.statisticsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500">{t('dashboard.openTickets')}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">{stats.openTickets || 0}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t('dashboard.closedTickets')}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600">{stats.closedTickets || 0}</p>
                    )}
                  </div>

                  {/* Role specific stats */}
                  {renderRoleSpecificStats()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Tickets */}
        {!['developer', 'tester'].includes(user?.role) && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600`} />
                  {t('dashboard.recentTickets')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.recentTicketsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-6 space-y-0">
                    {renderRecentTickets()}
                  </div>
                </div>

                {recentTickets.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewTickets}
                        className={`${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('dashboard.viewAllTickets')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}