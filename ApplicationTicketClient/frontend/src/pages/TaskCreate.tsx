// src/pages/TaskCreate.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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


export default function TaskCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Check if RTL is needed
  const rtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDevelopers, setAvailableDevelopers] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);

  // Get parentTask ID from query params if available
  const queryParams = new URLSearchParams(location.search);
  const parentTaskId = queryParams.get('parentTask');
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ticket: '',
    assignedTo: [],
    urgency: 'Medium',
    priority: '3',
    dueDate: '',
    estimatedHours: '',
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

  // File upload state
  const [attachments, setAttachments] = useState([]);

 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      let developersToShow = [];
      
      if (user.role === 'admin') {
        const devResponse = await api.get('/v1/user');
        const allUsers = devResponse.data;
        developersToShow = allUsers.filter(user => 
          user.role === 'developer' || user.role === 'groupLeader'
        );
      } else if (user.role === 'projectManager') {
        const hierarchyResponse = await api.get('/v1/user/hierarchical');
        const usersToShow = [];
      
        const currentPM = hierarchyResponse.data.find(pm => 
          pm._id && user.id && pm._id.toString() === user.id
        );
        if (currentPM && Array.isArray(currentPM.groupLeaders)) {
          currentPM.groupLeaders.forEach(gl => {
            usersToShow.push({ ...gl, role: 'groupLeader' });
      
            if (Array.isArray(gl.developers)) {
              gl.developers.forEach(dev => {
                usersToShow.push({ ...dev, role: 'developer' });
              });
            }
          });
        }
      
        developersToShow = usersToShow;
      } else if (user.role === 'groupLeader') {
        try {
          const leadersResponse = await api.get('/v1/user/leaders-with-developers');
          
          const currentLeader = leadersResponse.data.find(leader => 
            leader._id && user.id && leader._id.toString() === user.id
          );
          
          if (currentLeader && Array.isArray(currentLeader.developers)) {
            developersToShow = currentLeader.developers.map(dev => ({
              ...dev,
              role: 'developer'
            }));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des développeurs du Group Leader:', error);
        }
      }
      
      setAvailableDevelopers(developersToShow);
          try {
          const ticketResponse = await api.get('/v1/ticket/tickets');
          setAvailableTickets(ticketResponse.data);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          // Handle the error but don't block the rest of the function
          setAvailableTickets([]);
        }
  
        // If parentTask is provided, fetch parent task details
        if (parentTaskId) {
          const parentTaskResponse = await api.get(`/v1/task/${parentTaskId}`);
          // Pre-fill ticket from parent task if it exists
          if (parentTaskResponse.data.ticket) {
            setFormData(prev => ({
              ...prev,
              ticket: parentTaskResponse.data.ticket._id
            }));
          }
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
  
    fetchData();
  }, [parentTaskId, toast, t, user.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  const handleSelectChange = (name, value) => {
    if (name === 'assignedTo') {
      if (formData.assignedTo.includes(value)) {
        setFormData({
          ...formData,
          assignedTo: formData.assignedTo.filter((id) => id !== value)
        });
      } else {
        setFormData({
          ...formData,
          assignedTo: [...formData.assignedTo, value]
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
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
      
      setAttachments([...attachments, ...sanitizedFiles]);
    }
  };


  const removeFile = (index) => {
    const updatedFiles = [...attachments];
    updatedFiles.splice(index, 1);
    setAttachments(updatedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.description || !formData.urgency || !formData.priority) {
      toast({
        title: t('common.error'),
        description: t('common.requiredFields'),
        variant: 'destructive',
      });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const formDataToSend = new FormData();
  
      // Append all form fields individually
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array fields like assignedTo
          value.forEach(item => formDataToSend.append(`${key}[]`, item));
        } else if (value) {
          formDataToSend.append(key, value);
        }
      });
  
      // Append attachments
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });
  
      // Create task with proper headers
      const response = await api.post('/v1/task', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      toast({
        title: t('common.success'),
        description: t('tasks.createSuccess'),
      });
  
      // Redirect logic remains same
      if (parentTaskId) {
        navigate(`/tasks/${parentTaskId}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Validation errors:', error.response?.data?.errors);
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
          onClick={() => parentTaskId ? navigate(`/tasks/${parentTaskId}`) : navigate('/tasks')}
        >
          <ArrowLeft className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
          {parentTaskId ? t('tasks.backToParentTask') : t('tasks.backToTasks')}
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {parentTaskId ? t('tasks.createSubtask') : t('tasks.createTask')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tasks.taskInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-4 mb-6">
                <div>
                  <Label htmlFor="name">{t('tasks.taskName')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('tasks.description')} <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ticket">{t('tasks.relatedTicket')}</Label>
                    <Select
                      value={formData.ticket}
                      onValueChange={(value) => handleSelectChange('ticket', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('tasks.selectTicket')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('tasks.none')}</SelectItem>
                        {availableTickets.map((ticket) => (
                          <SelectItem key={ticket._id} value={ticket._id}>
                            {ticket.number} - {ticket.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">{t('tasks.assignTo')}</Label>
                    <ReactSelect
  isMulti
  options={availableDevelopers.map(dev => ({
    value: dev._id,
    label: `${dev.firstName} ${dev.lastName}${dev.role === 'groupLeader' ? ' (Group Leader)' : ' (Developer)'}`
  }))}
  value={availableDevelopers
    .filter(dev => formData.assignedTo.includes(dev._id))
    .map(dev => ({
      value: dev._id,
      label: `${dev.firstName} ${dev.lastName}${dev.role === 'groupLeader' ? ' (Group Leader)' : ' (Developer)'}`
    }))}
  onChange={(selectedOptions) => {
    const selectedIds = selectedOptions.map(opt => opt.value);
    setFormData(prev => ({
      ...prev,
      assignedTo: selectedIds
    }));
  }}
/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="urgency">{t('tasks.urgency')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => handleSelectChange('urgency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('tasks.selectUrgency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">{t('tasks.urgencyLevels.critical')}</SelectItem>
                        <SelectItem value="High">{t('tasks.urgencyLevels.high')}</SelectItem>
                        <SelectItem value="Medium">{t('tasks.urgencyLevels.medium')}</SelectItem>
                        <SelectItem value="Low">{t('tasks.urgencyLevels.low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">{t('tasks.priority')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleSelectChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('tasks.selectPriority')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">{t('tasks.priorityLevels.highest')}</SelectItem>
                        <SelectItem value="4">{t('tasks.priorityLevels.high')}</SelectItem>
                        <SelectItem value="3">{t('tasks.priorityLevels.medium')}</SelectItem>
                        <SelectItem value="2">{t('tasks.priorityLevels.low')}</SelectItem>
                        <SelectItem value="1">{t('tasks.priorityLevels.lowest')}</SelectItem>
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
                  <Label htmlFor="estimatedHours">{t('tasks.estimatedHours')}</Label>
                  <Input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="attachments">{t('tickets.attachments')}</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1"
                  />

                  {attachments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">{t('tickets.selectedFiles')}:</p>
                      <ul className="space-y-1">
                        {attachments.map((file, index) => (
                          <li key={index} className={`flex justify-between items-center text-sm bg-gray-50 p-2 rounded ${rtl ? 'flex-row-reverse' : ''}`}>
                            <span>{file.name}</span>
                            <Button
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
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={`flex ${rtl ? 'justify-start space-x-reverse' : 'justify-end'} space-x-4`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => parentTaskId ? navigate(`/tasks/${parentTaskId}`) : navigate('/tasks')}
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
                t('tasks.createTask')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}