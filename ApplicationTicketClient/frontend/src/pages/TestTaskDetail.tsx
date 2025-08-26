// src/pages/TaskDetail.tsx
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
  Paperclip,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Link as LinkIcon,
} from 'lucide-react';
import api from '../api/api';

export default function TestTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isUpdating, setIsUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Format time helper function
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if RTL is needed
  const rtl = i18n.language === 'ar';

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  // Timer effect for InProgress tasks
  useEffect(() => {
    let intervalId;
    
    if (task?.status === 'Testing') {
      const lastInProgressEntry = task?.history
        ?.filter(h => h.action === 'statusChanged' && h.details?.newStatus === 'Testing')
        ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (lastInProgressEntry) {
        const startTime = new Date(lastInProgressEntry.timestamp).getTime();
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        
        intervalId = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      }
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [task?.status, task?.history]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/testing/${id}`);
      setTask(response.data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tasks.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === task.status) return;

    setIsUpdating(true);
    try {
      // Calculate actual hours when moving to Testing status
      let updateData = { status: newStatus };
      
      if (newStatus === 'Testing' && task.status === 'Testing') {
        const lastInProgressEntry = task.history
          .filter(h => h.action === 'statusChanged' && h.details?.newStatus === 'Testing')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
        if (lastInProgressEntry) {
          const startTime = new Date(lastInProgressEntry.timestamp).getTime();
          const hoursWorked = (Date.now() - startTime) / (1000 * 60 * 60); // Convert to hours
          updateData.actualHours = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
        }
      }

      const response = await api.put(`/v1/testing/${id}`, updateData);
      setTask(response.data);
      toast({
        title: t('common.success'),
        description: t('tasks.statusUpdateSuccess', { status: newStatus }),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tasks.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsUpdating(true);
    try {
      const response = await api.post(`/v1/testing/${id}/comments`, { text: comment });
      setTask(response.data);
      setComment('');
      toast({
        title: t('common.success'),
        description: t('tasks.addComment'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tasks.commentError'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'ToDo': 'bg-gray-200 text-gray-800',
      'InProgress': 'bg-blue-100 text-blue-800',
      'Blocked': 'bg-red-100 text-red-800',
      'Declined': 'bg-amber-100 text-amber-800',
      'Testing': 'bg-purple-100 text-purple-800',
      'TestFailed': 'bg-red-100 text-red-800',
      'TestPassed': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800',
      'Overdue': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };
  const getStatusTextColorClass = (status) => {
    const statusTextColors = {
      'ToDo': 'text-gray-800',
      'InProgress': 'text-blue-800',
      'Blocked': 'text-red-800',
      'Declined': 'text-amber-800',
      'Testing': 'text-purple-800',
      'TestFailed': 'text-red-800',
      'TestPassed': 'text-green-800',
      'Expired': 'text-red-800',
      'Overdue': 'text-orange-800',
    };
    return statusTextColors[status] || 'text-gray-800'; // Default color
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t('tasks.notSet');
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 5: return t('tasks.priorityLevels.highest');
      case 4: return t('tasks.priorityLevels.high');
      case 3: return t('tasks.priorityLevels.medium');
      case 2: return t('tasks.priorityLevels.low');
      case 1: return t('tasks.priorityLevels.lowest');
      default: return t('tasks.priorityLevels.medium');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/task-tests')}
          >
            <ArrowLeft className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
            {t('tasks.backToTasks')}
          </Button>

          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('tasks.notFound')}</h2>
              <p className="text-gray-500 mb-6">{t('tasks.notFoundDescription')}</p>
              <Button onClick={() => navigate(user?.role === 'tester' ? '/tasks' : '/task-tests')}>
                {t('tasks.returnToList')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleDownload = async (fileUrl, fileName) => {
      try {
        // Make an authenticated GET request to your backend download endpoint
        // api.get will automatically add the Authorization header
        const response = await api.get(`/v1/testing/${task._id}/files/${fileUrl}`, {
          responseType: 'blob', // Important: tell Axios to expect binary data
        });
  
        // Create a blob from the response data
        const blob = new Blob([response.data]);
  
        // Create a temporary URL for the blob
        const downloadUrl = window.URL.createObjectURL(blob);
  
        // Create a temporary <a> element to trigger the download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileName); // Set the desired filename
        document.body.appendChild(link);
        link.click(); // Simulate a click to trigger download
  
        // Clean up
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
  
        toast({
          title: t('common.success'),
          description: t('tasks.downloadStarted', { fileName }),
        });
  
      } catch (error) {
        console.error("Download error:", error);
        toast({
          title: t('common.error'),
          description: t('tasks.downloadFailed'),
          variant: 'destructive',
        });
      }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate(user?.role === 'tester' ? '/tasks' : '/task-tests')}
            >
              <ArrowLeft className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
              {t('tasks.backToTasks')}
            </Button>
    
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <p className="text-sm text-gray-500">{t('tasks.taskNumber')}</p>
                      <h1 className="text-2xl font-bold text-gray-900">{task.number}</h1>
                    </div>
                    <Badge className={getStatusBadgeClass(task.status)}>
                      {t(`tasks.status.${task.status}`)}
                    </Badge>
                  </CardHeader>
    
                  <CardContent>
                    <h2 className="text-xl font-semibold mb-2">{task.name}</h2>
    
                    <div className="space-y-4 mt-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">{t('tasks.description')}</h3>
                        <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                          {task.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
    
                <Tabs
                  defaultValue="details"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-5 mb-4"> {/* Changed to 4 columns */}
                    <TabsTrigger value="details">{t('tasks.details')}</TabsTrigger>
                    <TabsTrigger value="subtasks">{t('tasks.subtasks')}</TabsTrigger>
                    { ['admin','responsibleTester'].includes(user?.role) && (
                      <TabsTrigger value="block">{t('tasks.block')}</TabsTrigger>
                    )}                
                    <TabsTrigger value="comments">{t('tasks.comments')}</TabsTrigger>
                    <TabsTrigger value="documents">{t('tasks.documents')}</TabsTrigger>
                  </TabsList>
    
                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('tasks.taskDetails')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.priority')}</p>
                            <p className="font-medium">{task.priority} - {getPriorityLabel(task.priority)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.urgency')}</p>
                            <p className="font-medium">{t(`tasks.urgencyLevels.${task.urgency.toLowerCase()}`)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.createdBy')}</p>
                            <p className="font-medium">{task.createdBy?.firstName} {task.createdBy?.lastName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.assignedTo')}</p>
                            <p className="font-medium">
                              {task.assignedTo
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                : t('tasks.unassigned')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.estimatedHours')}</p>
                            <p className="font-medium">{task.estimatedHours || t('tasks.notEstimated')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('tasks.actualHours')}</p>
                            <p className="font-medium">{task.actualHours || t('tasks.notTracked')}</p>
                          </div>
                        </div>
    
                        {task.ticket && (
                          <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('tasks.relatedTicket')}</h3>
                            <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
                              <div>
                                <p className="font-medium">{task.ticket.title}</p>
                                <p className="text-sm text-gray-500">{task.ticket.number}</p>
                              </div>
                              {user?.role !== 'admin' &&
                                (
                                  user?.id === task.ticket.projectManager ||
                                  user?.id === task.ticket.agentCommercial ||
                                  user?.id === task.ticket.createdBy ||
                                  user?.id === task.ticket.groupLeader
                                ) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/tickets/${task.ticket._id}`)}
                                  >
                                    <LinkIcon className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                                    {t('tasks.viewTicket')}
                                  </Button>
                                )}
    
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                {/* Subtasks Section */}
                  <TabsContent value="subtasks" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('tasks.subtasks')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                    {task.subtasks && task.subtasks.length > 0 ? (
                      <div className="space-y-3">
                        {task.subtasks.map((subtask) => {
                          console.log('Rendering subtask:', subtask);
                           if (!subtask) {
                                console.error('Found an UNDEFINED or NULL subtask in the array!', subtask);
                                return null; // Don't render if subtask is undefined/null
                              }
                          return(
                          <div key={subtask._id} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                            <div>
                              <p className="font-medium">{subtask.name}</p>
                              <p className="text-sm text-gray-500">{subtask.number}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusBadgeClass(subtask.status)}>
                                {t(`tasks.status.${subtask.status}`)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (!subtask._id) {
                                      toast({
                                        title: t('common.error'),
                                        description: t('tasks.invalidSubtaskId'),
                                        variant: 'destructive',
                                      });
                                      return;
                                    }
                                    const detailPath = `/test-tasks/${subtask._id}`;
                                    navigate(detailPath);
                                  }}
                              >
                                {t('tasks.viewSubtask')}
                              </Button>
                            </div>
                          </div>
                           );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-6">{t('tasks.noSubtasks')}</p>
                    )}

                    {['admin', 'projectManager', 'groupLeader'].includes(user?.role) && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/task-test/create?parentTask=${task._id}`)}
                        >
                          {t('tasks.addSubtask')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                    </Card>
                  </TabsContent>
    
                  {/* Block Section */}
                  <TabsContent value="block" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('tasks.block')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Array.isArray(task.blockers) && task.blockers.length > 0 ? (
                          <div className="space-y-4">
                            {task.blockers.map((blocker, index) => (
                              <Card 
                                key={index} 
                                className={`flex flex-col gap-4 p-4 ${
                                  blocker.resolved 
                                    ? 'bg-green-50 border-l-4 border-green-400' 
                                    : 'bg-red-50 border-l-4 border-red-400'
                                } shadow-sm`}
                              >
                                {/* Header with creator info */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0">
                                    {blocker.createdBy?.avatar ? (
                                      <img
                                        src={blocker.createdBy.avatar}
                                        alt={`${blocker.createdBy.firstName} ${blocker.createdBy.lastName}`}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg">
                                        {blocker.createdBy?.firstName?.[0]}
                                        {blocker.createdBy?.lastName?.[0]}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold">
                                        {blocker.createdBy?.firstName} {blocker.createdBy?.lastName}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(blocker.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              
                              {/* Blocker Content */}
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">{t('tasks.blockReason')}</h4>
                                  <p className="mt-1">{blocker.reason}</p>
                                </div>
                                {blocker.description && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700">{t('tasks.blockDescription')}</h4>
                                    <p className="mt-1">{blocker.description}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Resolution Info */}
                              {blocker.resolved && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">{t('tasks.resolvedBy')}: </span>
                                      <span>{blocker.resolvedBy?.firstName} {blocker.resolvedBy?.lastName}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(blocker.resolvedAt)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Resolution Actions */}
                              {!blocker.resolved && user.role === 'admin' && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResolveBlocker(blocker._id)}
                                    className="w-full"
                                  >
                                    {t('tasks.resolveBlock')}
                                  </Button>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4 mb-6">{t('tasks.noBlocks')}</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                  {/* Comments Section */}
                  <TabsContent value="comments" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('tasks.comments')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {task.comments && task.comments.length > 0 ? (
                          <div className="space-y-4 mb-6">
                            {task.comments.map((comment, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium">
                                    {comment.author?.firstName} {comment.author?.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                                </div>
                                <p className="text-sm">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-4 mb-6">{t('tasks.noComments')}</p>
                        )}
    
                        <form onSubmit={handleSubmitComment} className="space-y-4">
                          <Textarea
                            placeholder={t('tasks.commentPlaceholder')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full"
                            rows={3}
                          />
    
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isUpdating || !comment.trim()}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                                  {t('tasks.submitting')}
                                </>
                              ) : (
                                t('tasks.addComment')
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="documents" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('tasks.attachments')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {task.attachments?.length > 0 ? (
                          <div className="space-y-4">
                           {task.attachments.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {t('tasks.uploadedOn')} {formatDate(file.uploadedAt)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(file.url, file.name)}
                                >   
                                {t('tasks.download')}
                                </Button>
                              </div>
                        ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            {t('tasks.noDocuments')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
    
              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('tasks.status.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Conditional rendering for status control */}
                {user?.role === 'admin' ? (
                  // Admin can change the status
                  <Select
                    value={task.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tasks.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ToDo">{t('tasks.status.ToDo')}</SelectItem>
                      <SelectItem value="Blocked">{t('tasks.status.Blocked')}</SelectItem>
                      <SelectItem value="Declined">{t('tasks.status.Declined')}</SelectItem>
                      <SelectItem value="Testing">{t('tasks.status.Testing')}</SelectItem>
                      <SelectItem value="TestFailed">{t('tasks.status.TestFailed')}</SelectItem>
                      <SelectItem value="TestPassed">{t('tasks.status.TestPassed')}</SelectItem>
                      <SelectItem value="Expired">{t('tasks.status.Expired')}</SelectItem>
                      <SelectItem value="Overdue">{t('tasks.status.Overdue')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  // Responsible Tester and all other roles can only see the status
                  <div className="text-sm font-medium">
                    {t('testTask.status.currentStatus')}:{' '}
                    <span className={`font-semibold ${getStatusTextColorClass(task.status)}`}>
                      {t(`testTask.status.${task.status}`)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
                
                {/* Actions - only for developers assigned to the task 
                
                task.assignedTo && task.assignedTo._id === user.id && 
                */}
                {user?.role === 'tester' && task.assignedTo?._id === user?._id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('tasks.actions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.status === 'ToDo' && (
                        <Button
                          className="w-full"
                          onClick={() => handleStatusChange('Testing')}
                        >
                          <Clock className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                          {t('tasks.startWorking')}
                        </Button>
                      )}
    
                      {task.status === 'Testing' && (
                        <>
                          <div className="text-center p-3 bg-blue-50 rounded-md mb-3">
                            <p className="text-sm text-blue-600 mb-1">{t('tasks.timeElapsed')}</p>
                            <p className="text-2xl font-mono font-bold text-blue-700">
                              {formatTime(elapsedTime)}
                            </p>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => handleStatusChange('TestPassed')}
                          >
                            <CheckCircle className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                            {t('tasks.TestPassed')}
                          </Button>
                          <Button 
                            className="w-full bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => handleStatusChange('TestFailed')}
                            >
                            <XCircle className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                            {t('tasks.TestFailed')}
                        </Button>

                        </>
                      )}
        
                      {['ToDo', 'Testing'].includes(task.status) && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (task?._id) {
                              navigate(`/testing/${task._id}/block`);
                            } else {
                              console.error("Task ID is undefined!");
                            }
                          }}
                        >
                          <AlertCircle className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                          {t('tasks.reportBlocker')}
                        </Button>
    
                      )}
                    </CardContent>
                  </Card>
                )}
    
                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('tasks.timestamps')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('tasks.created')}</span>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('tasks.lastUpdated')}</span>
                        <span>{formatDate(task.updatedAt)}</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('tasks.dueDate')}</span>
                          <span className={
                            new Date(task.dueDate) < new Date() && task.status !== 'Done'
                              ? 'text-red-600 font-medium'
                              : ''
                          }>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
    
                {/* Task History */}
                {task.history && task.history.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('tasks.history')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {task.history.map((event, index) => (
                          <div key={index} className="border-l-2 border-blue-500 pl-3 py-1">
                            <p className="text-sm font-medium">
                              {event.action === 'created' && t('tasks.historyActions.created')}
                              {event.action === 'updated' && t('tasks.historyActions.updated')}
                              {event.action === 'statusChanged' && t('tasks.historyActions.statusChanged')}
                              {event.action === 'assigned' && t('tasks.historyActions.assigned')}
                              {event.action === 'blocked' && t('tasks.historyActions.blocked')}
                              {event.action === 'unblocked' && t('tasks.historyActions.unblocked')}
                              {event.action === 'commented' && t('tasks.historyActions.commented')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(event.timestamp)}
                            </p>
                            {event.details && event.action === 'statusChanged' && (
                              <p className="text-xs mt-1">
                                {t('tasks.statusChangeDetails', {
                                  previousStatus: event.details.previousStatus,
                                  newStatus: event.details.newStatus
                                })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      );
}