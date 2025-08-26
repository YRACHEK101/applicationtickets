import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Loader2,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MessageCircle,
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { TicketService } from '../api/TicketService';

// Ticket interface
interface Ticket {
  _id: string;
  number: string;
  title: string;
  application: string;
  environment: string;
  requestType: string;
  urgency: string;
  description: string;
  status: string;
  financialStatus: string;
  estimatedHours: number;
  actualHours: number;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  responsibleClient?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  agentCommercial?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Filter state interface
interface TicketFilters {
  status: string;
  requestType: string;
  urgency: string;
  application: string;
  searchTerm: string;
}

export default function TicketList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Check if RTL is needed
  const isRTL = i18n.language === 'ar';

  // State for tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filters
  const [filters, setFilters] = useState<TicketFilters>({
    status: 'all',
    requestType: 'all',
    urgency: 'all',
    application: 'all',
    searchTerm: '',
  });

  // State for available filter options (dynamically populated)
  const [applications, setApplications] = useState<string[]>([]);
  const [ticketTypes, setTicketTypes] = useState<string[]>([]);

  // State for view options
  const [viewMode, setViewMode] = useState('active');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Update available filter options when tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      // Extract unique applications
      const uniqueApplications = [...new Set(tickets.map(ticket => ticket.application))];
      setApplications(uniqueApplications);

      // Extract unique ticket types
      const uniqueTypes = [...new Set(tickets.map(ticket => ticket.requestType))];
      setTicketTypes(uniqueTypes);
    }
  }, [tickets]);

  // Apply filters when filter state changes
  useEffect(() => {
    if (tickets.length > 0) {
      let filtered = [...tickets];

      // Filter by search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(ticket =>
          ticket.title.toLowerCase().includes(term) ||
          ticket.number.toLowerCase().includes(term) ||
          ticket.description.toLowerCase().includes(term)
        );
      }

      // Filter by status
      if (filters.status !== 'all') {
        filtered = filtered.filter(ticket => ticket.status === filters.status);
      }

      // Filter by ticket type
      if (filters.requestType !== 'all') {
        filtered = filtered.filter(ticket => ticket.requestType === filters.requestType);
      }

      // Filter by urgency
      if (filters.urgency !== 'all') {
        filtered = filtered.filter(ticket => ticket.urgency === filters.urgency);
      }

      // Filter by application
      if (filters.application !== 'all') {
        filtered = filtered.filter(ticket => ticket.application === filters.application);
      }

      // Filter by view mode (active/draft/closed/all)
      if (viewMode === 'active') {
        filtered = filtered.filter(ticket => !['Closed', 'Draft', 'Expired'].includes(ticket.status));
      } else if (viewMode === 'closed') {
        filtered = filtered.filter(ticket => ['Closed', 'Expired'].includes(ticket.status));
      } else if (viewMode === 'draft') {
        filtered = filtered.filter(ticket => ticket.status === 'Draft');
      }
      // Sort by creation date, newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setFilteredTickets(filtered);
    }
  }, [filters, tickets, viewMode]);

  // Fetch tickets from the API
  const fetchTickets = async () => {
    setLoading(true);

    try {
      let data;

      // Get tickets based on user role
      if (user?.role === 'admin') {
        // Admin sees all tickets
        data = await TicketService.getAllTickets();
      } else if (user?.role === 'responsibleClient') {
        // Responsible client sees their assigned tickets
        data = await TicketService.getResponsibleTickets();
      } else if (user?.role === 'agentCommercial') {
        // Agent sees tickets with interventions assigned to them
        data = await TicketService.getAgentTickets();
      } else if (user?.role === 'groupLeader') {
        // Agent sees tickets with interventions assigned to them
        data = await TicketService.getGroupLeaderTickets();
      } else if (user?.role === 'projectManager') {
        // Agent sees tickets with interventions assigned to them
        data = await TicketService.getProjectManagerTickets();
      } else if (user?.role === 'responsibleTester') {
        // Agent sees tickets with interventions assigned to them
        data = await TicketService.getResponsibleTesterTickets();
      } else {
        // Regular client sees only their own tickets
        data = await TicketService.getClientTickets();
      }

      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update a filter value
  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      requestType: 'all',
      urgency: 'all',
      application: 'all',
      searchTerm: '',
    });
  };

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Get CSS class for ticket status badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-purple-200 text-purple-800';
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
        return 'bg-gray-500 text-white';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get displayed status label
  const getStatusLabel = (status: string) => {
    return t(`tickets.status.${status.toLowerCase()}`);
  };

  // Get CSS class for financial status badge
  const getFinancialBadgeClass = (status: string) => {
    switch (status) {
      case 'ToQualify':
        return 'bg-gray-200 text-gray-800';
      case 'Subscription':
        return 'bg-green-100 text-green-800';
      case 'FlexSubscription':
        return 'bg-teal-100 text-teal-800';
      case 'Quote':
        return 'bg-blue-100 text-blue-800';
      case 'ExcessHours':
        return 'bg-orange-100 text-orange-800';
      case 'ExcessInterventions':
        return 'bg-amber-100 text-amber-800';
      case 'ExtraOn':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get displayed financial status label
  const getFinancialStatusLabel = (status: string) => {
    return t(`tickets.financialStatus.${status.toLowerCase()}`);
  };

  // Get icon for ticket urgency
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'High':
        return <ArrowUpCircle className="h-4 w-4 text-orange-500" />;
      case 'Medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Low':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Determine actions available based on ticket status and user role
  const getTicketActions = (ticket: Ticket) => {
    const actions = [];

    // All users can view ticket details
    actions.push(
      <Button
        key="view"
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/tickets/${ticket._id}`)}
        className={`${isRTL ? 'flex flex-row-reverse' : ''} whitespace-nowrap`}
      >
        <Eye className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
        {t('common.view')}
      </Button>
    );

    // Responsible Client actions
    if (user?.role === 'responsibleClient') {
      actions.push(
        <Button
          key="manage"
          variant="outline"
          size="sm"
          onClick={() => navigate(`/tickets/${ticket._id}`)}
          className="whitespace-nowrap"
        >
          {t('common.manage')}
        </Button>
      );
    }

    // Admin actions
    if (user?.role === 'admin') {
      actions.push(
        <Button
          key="edit"
          variant="outline"
          size="sm"
          onClick={() => navigate(`/tickets/${ticket._id}`)}
          className="whitespace-nowrap"
        >
          {t('common.edit')}
        </Button>
      );
    }

    return actions;
  };

  // Send a saved ticket
  const handleSendTicket = async (ticketId: string) => {
    try {
      await TicketService.sendTicket(ticketId);

      toast({
        title: t('common.success'),
        description: t('tickets.sendSuccess'),
      });

      // Refresh ticket list
      fetchTickets();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.sendError'),
        variant: 'destructive',
      });
    }
  };

  // Get appropriate heading based on user role
  const getPageHeading = () => {
    switch (user?.role) {
      case 'client':
        return t('tickets.myTickets');
      case 'responsibleClient':
        return t('tickets.clientTicketsManagement');
      case 'agentCommercial':
        return t('tickets.assignedTickets');
      case 'admin':
        return t('tickets.allTickets');
      default:
        return t('tickets.title');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{getPageHeading()}</h1>

          {(user?.role === 'client' || user?.role === 'agentCommercial' || user?.role === 'admin') && (
            <Button
              onClick={() => navigate('/tickets/create')}
              className={isRTL ? 'flex flex-row-reverse' : ''}
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('tickets.createTicket')}
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <Tabs
            defaultValue="active"
            value={viewMode}
            onValueChange={setViewMode}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="active">{t('tickets.activeTickets')}</TabsTrigger>
              <TabsTrigger value="draft">{t('tickets.draftTickets')}</TabsTrigger>
              <TabsTrigger value="closed">{t('tickets.closedTickets')}</TabsTrigger>
              <TabsTrigger value="all">{t('tickets.allTickets')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-gray-500`} />
              <Input
                placeholder={t('tickets.searchPlaceholder')}
                className={isRTL ? 'pr-9' : 'pl-9'}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50' : ''}
            >
              <Filter className={`h-4 w-4 ${showFilters ? 'text-blue-600' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchTickets}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('tickets.filters')}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  {t('common.resetFilters')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tickets.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
                      <SelectItem value="Draft">{t('tickets.status.draft')}</SelectItem>
                      <SelectItem value="Registered">{t('tickets.status.registered')}</SelectItem>
                      <SelectItem value="Sent">{t('tickets.status.sent')}</SelectItem>
                      <SelectItem value="InProgress">{t('tickets.status.inProgress')}</SelectItem>
                      <SelectItem value="TechnicalValidation">{t('tickets.status.technicalValidation')}</SelectItem>
                      <SelectItem value="Revision">{t('tickets.status.revision')}</SelectItem>
                      <SelectItem value="ClientValidation">{t('tickets.status.clientValidation')}</SelectItem>
                      <SelectItem value="Validated">{t('tickets.status.validated')}</SelectItem>
                      <SelectItem value="Closed">{t('tickets.status.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.urgency}
                    onValueChange={(value) => handleFilterChange('urgency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tickets.filterByUrgency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tickets.allUrgencyLevels')}</SelectItem>
                      <SelectItem value="Critical">{t('tickets.urgencyLevels.critical')}</SelectItem>
                      <SelectItem value="High">{t('tickets.urgencyLevels.high')}</SelectItem>
                      <SelectItem value="Medium">{t('tickets.urgencyLevels.medium')}</SelectItem>
                      <SelectItem value="Low">{t('tickets.urgencyLevels.low')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.requestType}
                    onValueChange={(value) => handleFilterChange('requestType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tickets.filterByType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tickets.allTypes')}</SelectItem>
                      {ticketTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.application}
                    onValueChange={(value) => handleFilterChange('application', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tickets.filterByApplication')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tickets.allApplications')}</SelectItem>
                      {applications.map(app => (
                        <SelectItem key={app} value={app}>{app}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {viewMode === 'active' ? t('tickets.activeTickets') :
                viewMode === 'closed' ? t('tickets.closedTickets') : t('tickets.allTickets')}
            </CardTitle>
            <CardDescription>
              {filteredTickets.length} {t('tickets.found')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="w-full">
                {/* Hide horizontal scroll bar */}
                <div
                  className="overflow-x-auto scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* IE and Edge */
                  }}
                >
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">{t('tickets.ticketNumber')}</TableHead>
                        <TableHead className="min-w-[200px]">{t('tickets.ticketTitle')}</TableHead>
                        <TableHead className="min-w-[120px]">{t('tickets.application')}</TableHead>
                        <TableHead className="min-w-[120px]">{t('tickets.requestType')}</TableHead>
                        <TableHead className="min-w-[120px]">{t('tickets.status.title')}</TableHead>

                        {/* Show financial status for certain roles */}
                        {(user?.role === 'admin' || user?.role === 'responsibleClient' || user?.role === 'commercial') && (
                          <TableHead className="min-w-[140px]">{t('tickets.financialStatus.title')}</TableHead>
                        )}
                        {/* Show hours estimation for certain roles */}
                        {(user?.role === 'admin' || user?.role === 'responsibleClient') && (
                          <TableHead className="min-w-[100px]">{t('tickets.estimatedHours')}</TableHead>
                        )}

                        <TableHead className="min-w-[120px]">{t('tickets.createdAt')}</TableHead>
                        <TableHead className="min-w-[120px]">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket._id}>
                          <TableCell className="font-medium">
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {getUrgencyIcon(ticket.urgency)}
                              <span className="whitespace-nowrap">{ticket.number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-[200px] break-words"
                              title={ticket.title} // Show full title on hover
                            >
                              {truncateText(ticket.title, 50)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-[120px]"
                              title={ticket.application} // Show full application name on hover
                            >
                              <span className="truncate block">
                                {truncateText(ticket.application, 15)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-[120px]"
                              title={ticket.requestType}
                            >
                              <span className="truncate block">
                                {truncateText(ticket.requestType, 15)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeClass(ticket.status)} whitespace-nowrap text-xs`}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </TableCell>

                          {/* Show financial status for certain roles */}
                          {(user?.role === 'admin' || user?.role === 'responsibleClient' || user?.role === 'agentCommercial') && (
                            <TableCell>
                              <Badge className={`${getFinancialBadgeClass(ticket.financialStatus)} whitespace-nowrap text-xs`}>
                                {getFinancialStatusLabel(ticket.financialStatus)}
                              </Badge>
                            </TableCell>
                          )}

                          {/* Show hours estimation for certain roles */}
                          {(user?.role === 'admin' || user?.role === 'responsibleClient') && (
                            <TableCell>
                              <span className="whitespace-nowrap text-sm">
                                {ticket.estimatedHours || t('tickets.toDefine')}
                              </span>
                            </TableCell>
                          )}

                          <TableCell>
                            <span className="whitespace-nowrap text-sm">
                              {new Date(ticket.createdAt).toLocaleDateString(i18n.language)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
                              {getTicketActions(ticket)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">{t('tickets.noTicketsFound')}</p>
                {filters.searchTerm || filters.status !== 'all' || filters.requestType !== 'all' || filters.urgency !== 'all' || filters.application !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    {t('common.clearAllFilters')}
                  </Button>
                ) : user?.role === 'client' ? (
                  <Button
                    onClick={() => navigate('/tickets/create')}
                  >
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('tickets.createFirstTicket')}
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}