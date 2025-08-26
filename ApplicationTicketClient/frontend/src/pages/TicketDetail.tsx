import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Upload,
  Paperclip,
  ExternalLink,
  Clock,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Printer,
  Plus,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import api from '../api/api';
import { TicketService } from '../api/TicketService';



export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isUpdating, setIsUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState([]);

  // Check if RTL is needed
  const isRTL = i18n.language === 'ar';

  // Intervention state
  const [interventionData, setInterventionData] = useState({
    type: '',
    urgencyLevel: '',
    description: '',
    deadline: ''
  });
  const [showInterventionForm, setShowInterventionForm] = useState(false);

  // Meeting state
  const [meetingData, setMeetingData] = useState({
    title: '',
    dateTime: '',
    meetingLink: '',
    agenda: '',
    selectedAgents: []
  });
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  // Assignment state
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [availableResponsibles, setAvailableResponsibles] = useState([]);
  const [availableCommercials, setAvailableCommercials] = useState([]);
  const [availableGroupLeader, setAvailableGroupLeader] = useState([]);
  const [availableProjectManager, setAvailableProjectManager] = useState([]);
  const [availableResponsibleTester, setAvailableResponsibleTester] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    responsibleClient: '',
    commercial: '',
    projectManager:'',
    groupLeader:'',
    agents: []
  });

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  // Fetch available users when assignment dialog opens
  useEffect(() => {
    if (showAssignmentDialog) {
      fetchAvailableUsers();
    }
  }, [showAssignmentDialog]);

  const fetchTicketDetails = async () => {
    try {
      const data = await TicketService.getTicketById(id);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error); 
      toast({
        title: t('common.error'),
        description: t('tickets.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setIsUpdating(true);
      
      // Use the TicketService to fetch available users
      const data = await TicketService.getAvailableUsers();
      
      // Filter users by role
      setAvailableResponsibles(data.filter(user => user.role === 'responsibleClient'));
      setAvailableCommercials(data.filter(user => user.role === 'agentCommercial'));
      setAvailableProjectManager(data.filter(user => user.role === 'projectManager'));
      setAvailableGroupLeader(data.filter(user => user.role === 'groupLeader'));
      setAvailableResponsibleTester(data.filter(user => user.role === 'responsibleTester'));


      
      // Initialize with current assignments
      setAssignmentData({
        responsibleClient: ticket.responsibleClient?._id || '',
        commercial: ticket.agentCommercial?._id || '',
        projectManager: ticket.projectManager?._id || '',
        groupLeader: ticket.groupLeader?._id || '',
        agents: ticket.agents?.map(agent => agent._id) || []
      });
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast({
        title: t('common.error'),
        description: t('users.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Registered':
        return 'bg-gray-200 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'TechnicalValidation':
        return 'bg-purple-100 text-purple-800';
      case 'Revision':
        return 'bg-orange-100 text-orange-800';
      case 'ClientValidation':
        return 'bg-cyan-100 text-cyan-800';
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

  const getStatusLabel = (status) => {
    return status ? t(`tickets.status.${status.toLowerCase()}`) : t('tickets.status.unknown');
  };

  const getFinancialStatusLabel = (status) => {
    return t(`tickets.financialStatus.${status.toLowerCase()}`);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAdditionalFiles([...additionalFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
  };

  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === ticket.status) return;

    setIsUpdating(true);
    try {
      const data = await TicketService.updateTicketStatus(id, newStatus);
      setTicket(data);
      toast({
        title: t('common.success'),
        description: t('tickets.statusUpdateSuccess', { status: getStatusLabel(newStatus) }),
      }); 
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.statusUpdateError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() && additionalFiles.length === 0) return;
  
    setIsUpdating(true);
    try {
      const formData = new FormData();
      // Convert comment to string and ensure it's not an empty object
      const commentText = typeof comment === 'object' ? '' : comment.trim();
      formData.append('comment', commentText);
      
      // Append files if any
      additionalFiles.forEach((file) => {
        formData.append('files', file);
      });
  
      const data = await TicketService.addComment(id, formData);
      setTicket(data);
      setComment('');
      setAdditionalFiles([]);
  
      toast({
        title: t('common.success'),
        description: t('tickets.commentAddSuccess'),
      });
    } catch (error) {
      console.error('Comment error:', error);
      toast({
        title: t('common.error'),
        description: t('tickets.commentAddError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // For Responsible Client and Admin
  const handleUpdateTicket = async (field, value) => {
    setIsUpdating(true);
    try {
      const updateData = {
        [field]: value
      };
      const data = await TicketService.updateTicket(id, updateData);
      setTicket(data);
      
      let successMessage = '';
      if (field === 'financialStatus') {
        successMessage = t('tickets.financialStatusUpdateSuccess');
      } else if (field === 'estimatedHours') {
        successMessage = t('tickets.estimatedHoursUpdateSuccess');
      } else {
        successMessage = t('tickets.actualHoursUpdateSuccess');
      }
      
      toast({
        title: t('common.success'),
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.updateError', { field }),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // For Agents
  const startIntervention = async () => {
    setIsUpdating(true);
    try {
      const data = await TicketService.startIntervention(id);
      setTicket(data);
      toast({
        title: t('common.success'),
        description: t('tickets.interventionStartSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.interventionStartError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const requestValidation = async () => {
    setIsUpdating(true);
    try {
      const data = await TicketService.requestValidation(id);
      setTicket(data);
      toast({
        title: t('common.success'),
        description: t('tickets.validationRequestSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.validationRequestError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Only Responsible Client
  const validateIntervention = async (interventionId, isApproved) => {
    setIsUpdating(true);
    try {
      const data = await TicketService.validateIntervention(id, interventionId, isApproved);
      setTicket(data);
      toast({
        title: t('common.success'),
        description: isApproved 
          ? t('tickets.interventionApproveSuccess')
          : t('tickets.interventionRejectSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.interventionValidationError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Create intervention (for Responsible Client)
  const handleInterventionChange = (field, value) => {
    setInterventionData({
      ...interventionData,
      [field]: value
    });
  };

  const createIntervention = async () => {
    if (!interventionData.type || !interventionData.urgencyLevel || !interventionData.description) {
      toast({
        title: t('common.warning'),
        description: t('common.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const data = await TicketService.createIntervention(id, interventionData);
      setTicket(data);
      setInterventionData({
        type: '',
        urgencyLevel: '',
        description: '',
        deadline: ''
      });
      setShowInterventionForm(false);
      toast({
        title: t('common.success'),
        description: t('tickets.interventionCreateSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.interventionCreateError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Create meeting (for Responsible Client)
  const handleMeetingChange = (field, value) => {
    setMeetingData({
      ...meetingData,
      [field]: value
    });
  };

  const createMeeting = async () => {
    if (!meetingData.title || !meetingData.dateTime || !meetingData.meetingLink) {
      toast({
        title: t('common.warning'),
        description: t('common.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const data = await TicketService.createMeeting(id, meetingData);
      setTicket(data);
      setMeetingData({
        title: '',
        dateTime: '',
        meetingLink: '',
        agenda: '',
        selectedAgents: []
      });
      setShowMeetingForm(false);
      toast({
        title: t('common.success'),
        description: t('tickets.meetingScheduleSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.meetingScheduleError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignmentChange = (field, value) => {
    setAssignmentData({
      ...assignmentData,
      [field]: value === "none" ? "" : value
    });
  };

  // Handle agent selection (multiple)
  const handleAgentSelection = (agentId) => {
    const currentAgents = [...assignmentData.agents];

    if (currentAgents.includes(agentId)) {
      // Remove if already selected
      setAssignmentData({
        ...assignmentData,
        agents: currentAgents.filter(id => id !== agentId)
      });
    } else {// Add if not already selected
      setAssignmentData({
        ...assignmentData,
        agents: [...currentAgents, agentId]
      });
    }
  };

  const downloadAttachment = async (attachment) => {
          
    try {
      // Use axios.api for authenticated requests, similar to TaskDetail.tsx
      // The backend route is /v1/ticket/:id/attachments/:attachmentId
      const requestUrl = `/v1/ticket/${id}/attachments/${attachment._id}`;

      const response = await api.get(requestUrl, {
        responseType: 'blob', // Important: tell Axios to expect binary data
      });


      // Create a blob from the response data
      const blob = new Blob([response.data]);

      // Create a temporary URL for the blob
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a temporary <a> element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', attachment.name); // Use attachment.name for the filename
      document.body.appendChild(link);
      link.click(); // Simulate a click to trigger download

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: t('common.success'),
        description: t('tickets.attachmentDownloaded'),
      });

    } catch (error) {
     console.error('Download error (in downloadAttachment):', error); // ADD THIS LOG
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('tickets.attachmentDownloadError'),
        variant: 'destructive',
      });
    }
  };
  // Save assignments
  const saveAssignments = async () => {
    setIsUpdating(true);
    try {
      const data = await TicketService.assignTeam(id, assignmentData);
      setTicket(data);
      setShowAssignmentDialog(false);
      toast({
        title: t('common.success'),
        description: t('tickets.assignmentUpdateSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tickets.assignmentUpdateError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const downloadCommentFile = async (fileUrl: string, fileName: string) => {
    try {
      // Use axios.api for authenticated requests, similar to TaskDetail.tsx
      // The fileUrl from comments is already a full path like /server/uploads/comments/...
      const response = await api.get(fileUrl, { // Direct use of fileUrl as it's already a path
        responseType: 'blob', // Important: tell Axios to expect binary data
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('common.success'),
        description: t('tickets.downloadSuccess'),
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: t('common.error'),
        description: t('tickets.downloadError'),
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`min-h-screen bg-gray-100 p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/tickets')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.back')} {t('tickets.title')}
          </Button>

          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('tickets.notFound')}</h2>
              <p className="text-gray-500 mb-6">{t('tickets.requestedNotFound')}</p>
              <Button onClick={() => navigate('/tickets')}>
                {t('tickets.backToList')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 p-4 md:p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.back')} {t('tickets.title')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <p className="text-sm text-gray-500">{t('tickets.ticketNumber')}</p>
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.number}</h1>
                </div>
                <Badge className={getStatusBadgeColor(ticket.status)}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </CardHeader>

              <CardContent>
                <h2 className="text-xl font-semibold mb-2">{ticket.title}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">{t('tickets.application')}</p>
                    <p className="font-medium">{ticket.application}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('tickets.environment')}</p>
                    <p className="font-medium">{ticket.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('tickets.requestType')}</p>
                    <p className="font-medium">{ticket.requestType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('tickets.urgency.title')}</p>
                    <p className="font-medium">{ticket.urgency}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{t('tickets.description')}</h3>
                    <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                      {ticket.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs
              defaultValue="activities"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className={`grid ${
                ['agentCommercial', 'admin', 'responsibleClient'].includes(user?.role) 
                  ? 'grid-cols-5' 
                  : 'grid-cols-3'
              } mb-4 ${isRTL ? 'rtl-flex-row-reverse' : ''}`}>
                <TabsTrigger value="activities">{t('tickets.activities.title')}</TabsTrigger>
                <TabsTrigger value="files">{t('tickets.attachments')}</TabsTrigger>
                <TabsTrigger value="comments">{t('tickets.comments')}</TabsTrigger>
                {/* Conditionally show Contacts & Meetings tabs */}
                {['agentCommercial', 'admin', 'responsibleClient'].includes(user?.role) && (
                  <>
                    <TabsTrigger value="contacts">{t('tickets.contacts.contact')}</TabsTrigger>
                    <TabsTrigger value="meetings">{t('tickets.meetings.title')}</TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="activities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tickets.history')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4">
                      {ticket.activities && ticket.activities.length > 0 ? (
                        <div className="space-y-4">
                          {ticket.activities.map((activity, index) => (
                            <div key={index} className={`${isRTL ? 'border-r-2 pr-4' : 'border-l-2 pl-4'} border-blue-500 py-2`}>
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {t(`tickets.activities.${activity.type}`, activity.type)}
                                </p>
                                <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
                              </div>
                              {activity.type === 'status_change' && (
                                <p className="text-sm">
                                  {t('tickets.statusChangedFrom', {
                                    from: getStatusLabel(activity.from),
                                    to: getStatusLabel(activity.to)
                                  })}
                                </p>
                              )}
                              {activity.type === 'meeting_scheduled' && activity.metadata && (
                                <p className="text-sm">
                                  {t('tickets.meetingScheduled', {
                                    title: activity.metadata.meetingTitle,
                                    date: new Date(activity.metadata.meetingDate).toLocaleString()
                                  })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{t('tickets.noActivities')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Intervention Section for Responsible Client */}
                {['responsibleClient', 'admin'].includes(user?.role) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('tickets.interventions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {showInterventionForm ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="interventionType">{t('tickets.interventionType')}*</Label>
                            <Select
                              value={interventionData.type}
                              onValueChange={(value) => handleInterventionChange('type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('common.select')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Correction">{t('tickets.interventionTypes.correction')}</SelectItem>
                                <SelectItem value="Evolution">{t('tickets.interventionTypes.evolution')}</SelectItem>
                                <SelectItem value="Support">{t('tickets.interventionTypes.support')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="urgencyLevel">{t('tickets.urgencyLevel')}*</Label>
                            <Select
                              value={interventionData.urgencyLevel}
                              onValueChange={(value) => handleInterventionChange('urgencyLevel', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('common.select')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Critical">{t('tickets.urgencyLevels.critical')}</SelectItem>
                                <SelectItem value="High">{t('tickets.urgencyLevels.high')}</SelectItem>
                                <SelectItem value="Medium">{t('tickets.urgencyLevels.medium')}</SelectItem>
                                <SelectItem value="Low">{t('tickets.urgencyLevels.low')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="deadline">{t('tickets.interventionDeadline')}</Label>
                            <Select
                              value={interventionData.deadline}
                              onValueChange={(value) => handleInterventionChange('deadline', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('common.select')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1h">{t('tickets.deadlines.lessThan1h')}</SelectItem>
                                <SelectItem value="2h">{t('tickets.deadlines.lessThan2h')}</SelectItem>
                                <SelectItem value="4h">{t('tickets.deadlines.lessThan4h')}</SelectItem>
                                <SelectItem value="8h">{t('tickets.deadlines.lessThan8h')}</SelectItem>
                                <SelectItem value="24h">{t('tickets.deadlines.atMost24h')}</SelectItem>
                                <SelectItem value="48h">{t('tickets.deadlines.atMost48h')}</SelectItem>
                                <SelectItem value="none">{t('tickets.deadlines.noCondition')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="interventionDescription">{t('tickets.detailedDescription')}*</Label>
                            <Textarea
                              id="interventionDescription"
                              value={interventionData.description}
                              onChange={(e) => handleInterventionChange('description', e.target.value)}
                              rows={4}
                            />
                          </div>

                          <div className={`flex justify-end ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                            <Button
                              variant="outline"
                              onClick={() => setShowInterventionForm(false)}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button
                              onClick={createIntervention}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                                  {t('common.creating')}
                                </>
                              ) : (
                                t('tickets.createIntervention')
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ticket.interventions && ticket.interventions.length > 0 ? (
                            <div className="space-y-4">
                              {ticket.interventions.map((intervention, index) => (
                                <div key={index} className="p-4 border rounded-md">
                                  <div className="flex justify-between mb-2">
                                    <h3 className="font-medium">{t('tickets.intervention')} #{index + 1}</h3>
                                    <Badge
                                      className={
                                        intervention.validated === true ? 'bg-green-100 text-green-800' :
                                          intervention.validated === false ? 'bg-red-100 text-red-800' :
                                            intervention.validationRequested ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {intervention.validated === true ? t('tickets.validated') :
                                        intervention.validated === false ? t('tickets.rejected') :
                                          intervention.validationRequested ? t('tickets.pendingValidation') :
                                            t('tickets.inProgress')}
                                    </Badge>
                                  </div>
                                  <div className="text-sm space-y-2">
                                    <p><span className="text-gray-500">{t('tickets.type')}:</span> {intervention.type}</p>
                                    <p><span className="text-gray-500">{t('tickets.urgency')}:</span> {intervention.urgencyLevel}</p>
                                    {intervention.deadline && (
                                      <p><span className="text-gray-500">{t('tickets.deadline')}:</span> {intervention.deadline}</p>
                                    )}
                                    <p><span className="text-gray-500">{t('tickets.description')}:</span> {intervention.description}</p>
                                    <p><span className="text-gray-500">{t('tickets.createdAt')}:</span> {formatDate(intervention.createdAt)}</p>

                                    {intervention.startedAt && (
                                      <p><span className="text-gray-500">{t('tickets.startedAt')}:</span> {formatDate(intervention.startedAt)}</p>
                                    )}

                                    {/* Validation actions for Responsible Client */}
                                    {user?.role === 'responsibleClient' &&
                                      intervention.validationRequested &&
                                      intervention.validated === undefined && (
                                        <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-2 mt-2`}>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                            onClick={() => validateIntervention(intervention._id, false)}
                                            disabled={isUpdating}
                                          >
                                            {t('common.reject')}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                            onClick={() => validateIntervention(intervention._id, true)}
                                            disabled={isUpdating}
                                          >
                                            {t('common.validate')}
                                          </Button>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (<p className="text-sm text-gray-600 mb-4">{t('tickets.noInterventionsCreated')}</p>
                          )}

                          <Button
                            onClick={() => setShowInterventionForm(true)}
                            variant="outline"
                            className={isRTL ? 'flex flex-row-reverse' : ''}
                          >
                            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('tickets.createNewIntervention')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="files" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tickets.attachments')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ticket.attachments && ticket.attachments.length > 0 ? (
                      <ul className="space-y-2">
                        {ticket.attachments.map((attachment, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Paperclip className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              <span className="text-sm">{attachment.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              {t('common.download')}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">{t('tickets.noAttachment')}</p>
                    )}

                    {ticket.links && ticket.links.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2">{t('tickets.links')}</h3>
                        <ul className="space-y-2">
                          {ticket.links.map((link, index) => (
                            <li key={index} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {link.description}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ticket.driveLink && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2">{t('tickets.googleDriveLink')}</h3>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                          <a
                            href={ticket.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {t('tickets.sharedGoogleDriveFolder')}
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tickets.comments')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ticket.comments && ticket.comments.length > 0 ? (
                      <div className="space-y-4">
                        {ticket.comments.map((comment, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{comment.author}</div>
                              <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                            </div>
                            <p className="text-sm mb-2">{comment.text}</p>
                            {comment.files && comment.files.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">{t('tickets.attachments')}:</p>
                                <div className="flex flex-wrap gap-2">
                                  {comment.files.map((file, fileIndex) => (
                                    <button
                                      key={fileIndex}
                                      onClick={() => downloadCommentFile(file.url, file.name)}
                                      className={`text-xs bg-gray-200 py-1 px-2 rounded flex items-center hover:bg-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                                    >
                                      <Paperclip className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {file.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">{t('tickets.noComments')}</p>
                    )}

                    <form onSubmit={handleSubmitComment} className="mt-4">
                      <div className="space-y-4">
                        <Textarea
                          placeholder={t('tickets.addCommentPlaceholder')}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full"
                          rows={3}
                        />

                        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                          <Input
                            type="file"
                            id="comment-files"
                            onChange={handleFileChange}
                            multiple
                            className="flex-1"
                          />
                        </div>

                        {additionalFiles.length > 0 && (
                          <div className="mt-2">
                            <h3 className="text-sm font-medium mb-2">{t('tickets.selectedFiles')}:</h3>
                            <ul className="space-y-1">
                              {additionalFiles.map((file, index) => (
                                <li key={index} className={`flex items-center justify-between bg-gray-50 p-2 rounded text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <span>{file.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                  >
                                    ×
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button type="submit" disabled={isUpdating} className={isRTL ? 'flex flex-row-reverse' : ''}>
                            {isUpdating ? (
                              <>
                                <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                                {t('common.sending')}
                              </>
                            ) : (
                              t('tickets.addComment')
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              {['agentCommercial', 'admin', 'responsibleClient'].includes(user?.role) && (
              <>
              <TabsContent value="contacts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tickets.contactInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ticket.contacts && ticket.contacts.length > 0 ? (
                      <div className="space-y-4">
                        {ticket.contacts.map((contact, index) => (
                          <div key={index} className="p-4 border rounded-md">
                            <h3 className="font-medium mb-2">{contact.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">{t('auth.email')}: </span>
                                <span>{contact.email}</span>
                              </div>
                              {contact.phone && (
                                <div>
                                  <span className="text-gray-500">{t('users.phone')}: </span>
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                            </div>

                            {contact.availability && contact.availability.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-500 text-sm mb-1">{t('tickets.meetingAvailability')}:</p>
                                <div className="flex flex-wrap gap-2">
                                  {contact.availability.map((slot, slotIndex) => (
                                    <span
                                      key={slotIndex}
                                      className="text-xs bg-gray-100 py-1 px-2 rounded"
                                    >
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{t('tickets.noContactInfo')}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meetings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tickets.meetings.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Meeting form for Responsible Client */}
                    {['responsibleClient', 'admin'].includes(user?.role) && (
                      <>
                        {showMeetingForm ? (
                          <div className="space-y-4 mb-6 p-4 border rounded-md">
                            <div>
                              <Label htmlFor="meetingTitle">{t('tickets.meetingTitle')}*</Label>
                              <Input
                                id="meetingTitle"
                                value={meetingData.title}
                                onChange={(e) => handleMeetingChange('title', e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="meetingDateTime">{t('tickets.dateTime')}*</Label>
                              <Input
                                id="meetingDateTime"
                                type="datetime-local"
                                value={meetingData.dateTime}
                                onChange={(e) => handleMeetingChange('dateTime', e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="meetingLink">{t('tickets.meetingLink')}*</Label>
                              <Input
                                id="meetingLink"
                                value={meetingData.meetingLink}
                                onChange={(e) => handleMeetingChange('meetingLink', e.target.value)}
                                placeholder="Teams, Zoom, Google Meet..."
                              />
                            </div>

                            <div>
                              <Label htmlFor="meetingAgenda">{t('tickets.agenda')}</Label>
                              <Textarea
                                id="meetingAgenda"
                                value={meetingData.agenda}
                                onChange={(e) => handleMeetingChange('agenda', e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label className="mb-2 block">{t('tickets.selectAgents')}</Label>
                              {ticket.agents && ticket.agents.length > 0 ? (
                                <div className="space-y-2">
                                  {ticket.agents.map((agent) => (
                                    <div key={agent._id} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                      <input
                                        type="checkbox"
                                        id={`agent-${agent._id}`}
                                        checked={meetingData.selectedAgents.includes(agent._id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleMeetingChange('selectedAgents', [
                                              ...meetingData.selectedAgents,
                                              agent._id
                                            ]);
                                          } else {
                                            handleMeetingChange('selectedAgents',
                                              meetingData.selectedAgents.filter(id => id !== agent._id)
                                            );
                                          }
                                        }}
                                        className={isRTL ? 'ml-2' : 'mr-2'}
                                      />
                                      <Label htmlFor={`agent-${agent._id}`} className="text-sm">
                                        {agent.firstName} {agent.lastName}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">{t('tickets.noAgentsAssigned')}</p>
                              )}
                            </div>

                            <div className={`flex justify-end ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                              <Button
                                variant="outline"
                                onClick={() => setShowMeetingForm(false)}
                              >
                                {t('common.cancel')}
                              </Button>
                              <Button
                                onClick={createMeeting}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <>
                                    <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                                    {t('tickets.scheduling')}
                                  </>
                                ) : (
                                  t('tickets.scheduleMeeting')
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setShowMeetingForm(true)}
                            className={`mb-6 ${isRTL ? 'flex flex-row-reverse' : ''}`}
                          >
                            <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('tickets.scheduleMeeting')}
                          </Button>
                        )}
                      </>
                    )}

                    {/* Meeting list */}
                    {ticket.meetings && ticket.meetings.length > 0 ? (
                      <div className="space-y-4">
                        {ticket.meetings.map((meeting, index) => (
                          <div key={index} className="p-4 border rounded-md">
                            <div className="mb-2">
                              <h3 className="font-medium">{meeting.title}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(meeting.dateTime).toLocaleString(i18n.language)}
                              </p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                                <a
                                  href={meeting.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {t('tickets.meetingLink')}
                                </a>
                              </p>
                              {meeting.agenda && (
                                <div>
                                  <p className="text-gray-500 mb-1">{t('tickets.agenda')}:</p>
                                  <p className="whitespace-pre-wrap">{meeting.agenda}</p>
                                </div>
                              )}
                              {meeting.attendees && meeting.attendees.length > 0 && (
                                <div>
                                  <p className="text-gray-500 mb-1">{t('tickets.participants')}:</p>
                                  <ul className={`list-disc ${isRTL ? 'pr-5' : 'pl-5'}`}>
                                    {meeting.attendees.map((attendee, attendeeIndex) => (
                                      <li key={attendeeIndex}>
                                        {attendee.firstName} {attendee.lastName}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{t('tickets.noMeetingsScheduled')}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              </>)}
            </Tabs>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Status Section - Only for certain roles */}
            {['responsibleClient', 'admin'].includes(user?.role) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('tickets.manageStatus')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tickets.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registered">{t('tickets.status.registered')}</SelectItem>
                      <SelectItem value="Sent">{t('tickets.status.sent')}</SelectItem>
                      <SelectItem value="InProgress">{t('tickets.status.inProgress')}</SelectItem>
                      <SelectItem value="TechnicalValidation">{t('tickets.status.technicalValidation')}</SelectItem>
                      <SelectItem value="Revision">{t('tickets.status.revision')}</SelectItem>
                      <SelectItem value="ClientValidation">{t('tickets.status.clientValidation')}</SelectItem>
                      <SelectItem value="Validated">{t('tickets.status.validated')}</SelectItem>
                      <SelectItem value="Closed">{t('tickets.status.closed')}</SelectItem>
                      <SelectItem value="Expired">{t('tickets.status.expired')}</SelectItem>
                       <SelectItem value="Draft">{t('tickets.status.draft')}</SelectItem>

                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Financial Status - Only for certain roles */}
            {['responsibleClient', 'admin', 'agentCommercial'].includes(user?.role) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('tickets.financialStatus.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('tickets.currentStatus')}</p>
                      <div className="font-medium">
                        {getFinancialStatusLabel(ticket.financialStatus)}
                      </div>
                    </div>

                    {['responsibleClient', 'admin'].includes(user?.role) && (
                      <Select
                        value={ticket.financialStatus}
                        onValueChange={(value) => handleUpdateTicket('financialStatus', value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('tickets.updateStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ToQualify">{t('tickets.financialStatus.toQualify')}</SelectItem>
                          <SelectItem value="Subscription">{t('tickets.financialStatus.subscription')}</SelectItem>
                          <SelectItem value="Quote">{t('tickets.financialStatus.quote')}</SelectItem>
                          <SelectItem value="FlexSubscription">{t('tickets.financialStatus.flexSubscription')}</SelectItem>
                          <SelectItem value="ExcessHours">{t('tickets.financialStatus.excessHours')}</SelectItem>
                          <SelectItem value="ExcessInterventions">{t('tickets.financialStatus.excessInterventions')}</SelectItem>
                          <SelectItem value="ExtraOn">{t('tickets.financialStatus.extraOn')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time tracking - Only for certain roles */}
            {['responsibleClient', 'admin', 'projectManager'].includes(user?.role) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('tickets.timeTracking')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="estimatedHours">{t('tickets.estimatedHours')}</Label>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 mt-1`}>
                        <Input
                          id="estimatedHours"
                          type="number"
                          value={ticket.estimatedHours || ''}
                          onChange={(e) => handleUpdateTicket('estimatedHours', e.target.value)}
                          placeholder={t('tickets.enterHours')}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">{t('tickets.hours')}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="actualHours">{t('tickets.actualHours')}</Label>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 mt-1`}>
                        <Input
                          id="actualHours"
                          type="number"
                          value={ticket.actualHours || ''}
                          onChange={(e) => handleUpdateTicket('actualHours', e.target.value)}
                          placeholder={t('tickets.enterHours')}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">{t('tickets.hours')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned Team */}
            {(user?.role === 'admin' || user?.role === 'responsibleClient'|| user?.role === 'agentCommercial') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('tickets.assignedTeam')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                {(user?.role === 'admin' || user?.role === 'responsibleClient') && (
                  <>
                    {ticket.responsibleClient ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('tickets.responsibleClient')}</p>
                        <div className="font-medium">{ticket.responsibleClient.firstName} {ticket.responsibleClient.lastName}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('tickets.noResponsibleClientAssigned')}</p>
                    )}</>
                    )}
                     {(user?.role === 'admin' || user?.role === 'agentCommercial') && (
                    <>
                    {ticket.agentCommercial ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('tickets.agentCommercial')}</p>
                        <div className="font-medium">{ticket.agentCommercial.firstName} {ticket.agentCommercial.lastName}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('tickets.noAgentCommercialAssigned')}</p>
                    )}
                    {ticket.projectManager ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('tickets.projectManager')}</p>
                        <div className="font-medium">{ticket.projectManager.firstName} {ticket.projectManager.lastName}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('tickets.noProjectManagerAssigned')}</p>
                    )}

                    {ticket.groupLeader ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('tickets.groupLeader')}</p>
                        <div className="font-medium">{ticket.groupLeader.firstName} {ticket.groupLeader.lastName}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('tickets.noGroupLeaderAssigned')}</p>
                    )}
                    {ticket.responsibleTester ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('tickets.responsibleTester')}</p>
                        <div className="font-medium">{ticket.responsibleTester.firstName} {ticket.responsibleTester.lastName}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('tickets.noGroupLeaderAssigned')}</p>
                    )}
                  </>
                )}

                  {/* Assignment controls for admin/responsible client */}
                  {['admin','agentCommercial'].includes(user?.role) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full mt-2 ${isRTL ? 'flex flex-row-reverse' : ''}`}
                        onClick={() => {
                          setShowAssignmentDialog(true);
                          // Fetch users when button is clicked
                          fetchAvailableUsers();
                        }}
                      >
                        <Users className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('tickets.manageAssignments')}
                      </Button>

                      {/* Dialog component with controlled open state */}
                      <Dialog
                        open={showAssignmentDialog}
                        onOpenChange={(open) => {
                          setShowAssignmentDialog(open);
                          // If dialog is opening, fetch users
                          if (open) {
                            fetchAvailableUsers();
                          }
                        }}
                      >
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>{t('tickets.manageAssignments')}</DialogTitle>
                            <DialogDescription>
                              {t('tickets.assignResponsibleAndAgents')}
                            </DialogDescription>
                          </DialogHeader>

                          {isUpdating ? (
                            <div className="py-8 flex justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            <div className="space-y-4 py-4">
                              {user?.role === 'admin' && (
                                <>
                                  <div>
                                    <Label>{t('tickets.responsibleClient')}</Label>
                                    <Select
                                      value={assignmentData.responsibleClient}
                                      onValueChange={(value) => handleAssignmentChange('responsibleClient', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('tickets.selectResponsible')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableResponsibles.map(responsible => (
                                          <SelectItem key={responsible._id} value={responsible._id}>
                                            {responsible.firstName} {responsible.lastName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>{t('tickets.commercial')}</Label>
                                    <Select
                                      value={assignmentData.commercial}
                                      onValueChange={(value) => handleAssignmentChange('commercial', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('tickets.selectCommercial')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableCommercials.map(commercial => (
                                          <SelectItem key={commercial._id} value={commercial._id}>
                                            {commercial.firstName} {commercial.lastName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>{t('tickets.responsibleTester')}</Label>
                                    <Select
                                      value={assignmentData.responsibleTester}
                                      onValueChange={(value) => handleAssignmentChange('responsibleTester', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('tickets.selectresponsibleTester')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableResponsibleTester.map(responsibleTester => (
                                          <SelectItem key={responsibleTester._id} value={responsibleTester._id}>
                                            {responsibleTester.firstName} {responsibleTester.lastName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              )}

                              {(user?.role === 'admin' || user?.role === 'agentCommercial') && (
                                <>
                                <div>
                                  <Label>{t('tickets.projectManager')}</Label>
                                  <Select
                                    value={assignmentData.projectManager}
                                    onValueChange={(value) => handleAssignmentChange('projectManager', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('tickets.selectProjectManager')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableProjectManager.map(projectManager => (
                                        <SelectItem key={projectManager._id} value={projectManager._id}>
                                          {projectManager.firstName} {projectManager.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>{t('tickets.groupLeader')}</Label>
                                  <Select
                                    value={assignmentData.groupLeader}
                                    onValueChange={(value) => handleAssignmentChange('groupLeader', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('tickets.selectGroupLeader')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableGroupLeader.map(groupLeader => (
                                        <SelectItem key={groupLeader._id} value={groupLeader._id}>
                                          {groupLeader.firstName} {groupLeader.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                </>
                                
                              )}


                              {/* <div>
                                <Label className="mb-2 block">{t('tickets.technicalAgents')}</Label>
                                <div className="max-h-60 overflow-y-auto border rounded p-2">
                                  {availableAgents.length > 0 ? (
                                    availableAgents.map(agent => (
                                      <div key={agent._id} className={`flex items-center py-2 border-b last:border-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <input
                                          type="checkbox"
                                          id={`agent-${agent._id}`}
                                          checked={assignmentData.agents.includes(agent._id)}
                                          onChange={() => handleAgentSelection(agent._id)}
                                          className={isRTL ? 'ml-2' : 'mr-2'}
                                        />
                                        <Label htmlFor={`agent-${agent._id}`} className="cursor-pointer">
                                          {agent.firstName} {agent.lastName}
                                        </Label>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500 py-2">{t('tickets.noAgentsAvailable')}</p>
                                  )}
                                </div>
                              </div> */}
                            </div>
                          )}

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={saveAssignments} disabled={isUpdating}>
                              {isUpdating ? (
                                <>
                                  <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                                  {t('common.saving')}
                                </>
                              ) : (
                                t('common.save')
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
            {/* Agent Controls */}
            {user?.role === 'agentCommercial' && ticket.agents && ticket.agents.some(agent => agent._id === user._id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('common.actions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {!ticket.intervention || !ticket.intervention.startedAt ? (
                      <Button onClick={startIntervention} className={`w-full ${isRTL ? 'flex flex-row-reverse' : ''}`} disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        ) : (
                          <Clock className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        )}
                        {t('tickets.startIntervention')}
                      </Button>
                    ) : !ticket.intervention.validationRequested ? (
                      <Button onClick={requestValidation} className={`w-full ${isRTL ? 'flex flex-row-reverse' : ''}`} disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        ) : (
                          <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        )}
                        {t('tickets.requestValidation')}
                      </Button>
                    ) : (
                      <Button disabled className={`w-full ${isRTL ? 'flex flex-row-reverse' : ''}`}>
                        <Clock className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('tickets.waitingForValidation')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {ticket.additionalInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('tickets.additionalInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap">
                    {ticket.additionalInfo}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('tickets.details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('tickets.createdAt')}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('tickets.updatedAt')}</span>
                    <span>{formatDate(ticket.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('tickets.createdBy')}</span>
                    <span>{ticket.client?.firstName} {ticket.client?.lastName}</span>
                  </div>
                </div>
              
</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}