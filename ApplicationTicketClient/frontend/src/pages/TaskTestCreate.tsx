import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../api/api';
import ReactSelect from 'react-select';
import TicketService from '@/api/TicketService';

interface Ticket {
  _id: string;
  number: string;
  title: string;
}

interface Task {
  _id: string;
  number: string;
  name: string;
  status: string;
  description: string;
  dueDate?: string;
  createdBy?: any;
  assignedTo?: Array<{ _id: string; firstName: string; lastName: string }>;
}

export default function TaskTestCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [availableTesters, setAvailableTesters] = useState([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

   // Get parentTask ID from query params if available
  const queryParams = new URLSearchParams(location.search);
  const parentTaskId = queryParams.get('parentTask');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    assignedTo: [],
    testEnvironment: 'Staging',
    ticket: '',
    task: '',
    urgency: 'Medium',
    priority: '3',
    testCoverage: '',
    parentTask: parentTaskId || ''

  });

  // Function to sanitize file names - keep only alphanumeric, dots, hyphens, and underscores
  const sanitizeFileName = (fileName: string): string => {
    // Split the filename to preserve the extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    
    // Remove all non-alphanumeric characters except dots, hyphens, and underscores from name
    const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '');
    // Sanitize extension (keep dot and alphanumeric)
    const sanitizedExtension = extension.replace(/[^a-zA-Z0-9.]/g, '');
    
    // Combine sanitized name and extension
    const sanitizedFileName = sanitizedName + sanitizedExtension;
    
    // Ensure we don't have an empty filename
    return sanitizedFileName || 'file';
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {

        let ticketsData: Ticket[] = [];

        if (user?.role === 'responsibleTester') {
          ticketsData = await TicketService.getResponsibleTesterTickets();
        } else {
          ticketsData = await TicketService.getAllTickets();
        }

        console.log('Tickets response:', ticketsData);
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);

        const testersResponse = await api.get('/v1/user/testers');
        setAvailableTesters(testersResponse.data);

        // If parentTask is provided, fetch parent task details
                // If parentTask is provided, fetch parent task details
        if (parentTaskId) {
          const parentTaskResponse = await api.get(`/v1/testing/${parentTaskId}`); // Ensure this is /v1/testing/:id
          // Pre-fill ticket from parent task if it exists
          if (parentTaskResponse.data.ticket) {
            setFormData(prev => ({
              ...prev,
              ticket: parentTaskResponse.data.ticket._id
            }));
          }
          // --- NEW: Pre-fill assignedTo from parent task ---
          if (parentTaskResponse.data.assignedTo && parentTaskResponse.data.assignedTo.length > 0) {
            setFormData(prev => ({
              ...prev,
              assignedTo: parentTaskResponse.data.assignedTo.map(tester => tester._id)
            }));
          }
          // --- END NEW ---
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: t('common.error'),
          description: t('tasks.fetchDataError'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [parentTaskId, toast, t, user?.role]);

  const fetchTasksForTicket = async (ticketId: string) => {
    setLoadingTasks(true);
    try {
      const response = await api.get(`/v1/testing/tickets/${ticketId}/tasks`);
      const tasks = Array.isArray(response.data.data) ? response.data.data : [];

      console.log('tasks response:', tasks);

      setFilteredTasks(tasks.filter(task => task.status === 'Testing'));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setFilteredTasks([]);
      toast({
        title: t('common.error'),
        description: t('tasks.fetchTasksError'),
        variant: 'destructive',
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTicketChange = async (ticketId: string) => {
    setSelectedTicket(ticketId);
    setFormData(prev => ({ ...prev, ticket: ticketId, task: '' }));
    ticketId && await fetchTasksForTicket(ticketId);
  };

  const handleTaskChange = (taskId: string) => {
    const selectedTask = filteredTasks.find(t => t._id === taskId);
    if (selectedTask) {
      setFormData(prev => ({
        ...prev,
        task: taskId,
        name: `Test - ${selectedTask.name}`,
        description: `Testing task for ${selectedTask.number}: ${selectedTask.description}`
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
     const files = Array.from(e.target.files);
      
      // Create new File objects with sanitized names
      const sanitizedFiles = files.map(file => {
        const sanitizedName = sanitizeFileName(file.name);
        // Create a new File object with the sanitized name
        return new File([file], sanitizedName, {
          type: file.type,
          lastModified: file.lastModified,
        });
      });
      
      setAttachments(sanitizedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ticket || !formData.task || !formData.name || formData.assignedTo.length === 0) {
      toast({
        title: t('common.error'),
        description: t('common.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formPayload = new FormData();

      // Append regular fields
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formPayload.append(`${key}[]`, v));
        } else if (value) {
          formPayload.append(key, value);
        }else if (key === 'parentTask' && value === '') { // Explicitly append empty string for parentTask if it's empty
            formPayload.append(key, '');
        }
      });

      // Append fixed fields
      formPayload.append('status', 'Testing');
      formPayload.append('type', 'TEST');
      
      // Append attachments
      attachments.forEach(file => {
        formPayload.append('attachments', file);
      });

      // THIS IS WHERE THE API CALL IS MADE
      const response = await api.post('/v1/testing', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast({
        title: t('common.success'),
        description: t('tasks.testCreateSuccess'),
      });
      if (parentTaskId) {
        navigate(`/task-tests`);
      } else {
        navigate('/task-tests');
      }
    } catch (error) {
      console.error('Error creating test task:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('tasks.createError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${rtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
                <Button
                  variant="ghost"
                  className="mb-4"
                  onClick={() => parentTaskId ? navigate(`/task-tests/${parentTaskId}`) : navigate('/task-tests')}
                >
                  <ArrowLeft className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                  {parentTaskId ? t('tasks.backToParenttestTask') : t('tasks.backTotestTasks')}
                </Button>
        
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  {parentTaskId ? t('tasks.createSubtesttask') : t('tasks.createtestTask')}
                </h1> 
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tasks.testAssignment')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-4 mb-6">
                <div>
                  <Label>{t('tasks.selectTicket')} <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.ticket}
                    onValueChange={handleTicketChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tasks.selectTicket')} />
                    </SelectTrigger>
                    <SelectContent>
                      {tickets.length > 0 ? (
                        tickets.map(ticket => (
                          <SelectItem key={ticket._id} value={ticket._id}>
                            {ticket.number} - {ticket.title}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 px-4 py-2">
                          {t('tasks.noTicketsAvailable')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('tasks.selectTask')} <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.task}
                    onValueChange={handleTaskChange}
                    disabled={!selectedTicket || loadingTasks}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingTasks
                          ? t('common.loading')
                          : selectedTicket
                            ? t('tasks.selectTask')
                            : t('tasks.selectTicketFirst')
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTasks ? (
                        <div className="text-sm text-gray-500 px-4 py-2 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t('common.loading')}
                        </div>
                      ) : filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                          <SelectItem key={task._id} value={task._id}>
                            {task.number} - {task.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 px-4 py-2">
                          {t('tasks.noTasksAvailable')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">{t('tasks.testTaskName')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    disabled
                    value={formData.name}
                    onChange={handleChange}
                    required
                    readOnly
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('tasks.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('tasks.urgency')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={value => setFormData({ ...formData, urgency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('tasks.selectUrgency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">{t('tasks.priority')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="testCoverage">{t('tasks.testCoverage')} (%)</Label>
                    <Input
                      id="testCoverage"
                      name="testCoverage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.testCoverage}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assignedTo">{t('tasks.assignTesters')} <span className="text-red-500">*</span></Label>
                  <ReactSelect
                    isMulti
                    options={availableTesters.map(tester => ({
                      value: tester._id,
                      label: `${tester.firstName} ${tester.lastName} (${tester.role})`
                    }))}
                    value={availableTesters
                      .filter(tester => formData.assignedTo.includes(tester._id))
                      .map(tester => ({
                        value: tester._id,
                        label: `${tester.firstName} ${tester.lastName} (${tester.role})`
                      }))}
                    onChange={(selectedOptions) => {
                      const selectedIds = selectedOptions.map(opt => opt.value);
                      setFormData(prev => ({ ...prev, assignedTo: selectedIds }));
                    }}
                    className="z-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testEnvironment">{t('tasks.testEnvironment')}</Label>
                    <Select
                      value={formData.testEnvironment}
                      onValueChange={(value) => setFormData({ ...formData, testEnvironment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('tasks.selectEnvironment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Staging">Staging</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">{t('tasks.dueDate')}</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="attachments">{t('tasks.attachments')}</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {attachments.length} {t('tasks.filesSelected')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={`flex ${rtl ? 'justify-start space-x-reverse' : 'justify-end'} space-x-4`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => parentTaskId ? navigate(`/task-tests/${parentTaskId}`) : navigate('/task-tests')}

            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t('common.creating')}
                </>
              ) : (
                t('tasks.assignTesting')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}