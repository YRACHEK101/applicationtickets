import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { UserService } from '../api/UserService';
import { Loader2, Upload, Plus, Trash2, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { TicketService } from '../api/TicketService';
// Add these imports at the top of the file with other imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import { format } from 'date-fns';
import { useEffect } from 'react';


export default function TicketCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  // Add this new state for meeting datetime
  const [meetingDateTime, setMeetingDateTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [phoneErrors, setPhoneErrors] = useState({});
  const [dateErrors, setDateErrors] = useState({});

  // Check if RTL is needed - directly check for Arabic language
  const rtl = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    application: '',
    environment: '',
    requestType: '',
    urgency: '',
    description: '',
    driveLink: '',
    additionalInfo: ''

  });

  function formatRange(from, to) {
    const day = format(from, 'EEEE'); // Monday, Tuesday, etc.
    const fromTime = format(from, 'h:mmaaa'); // e.g., 2:00PM
    const toTime = format(to, 'h:mmaaa');     // e.g., 5:00PM
    return `${day} ${fromTime} - ${toTime}`;
  }
  // Link state
  const [links, setLinks] = useState([{ description: '', url: '' }]);

  useEffect(() => {
    if (['admin', 'responsibleClient', 'agentCommercial'].includes(user?.role)) {
      fetchClients();
    }
  }, [user?.role]);
  // Contacts state
  // Update the contacts state initialization
  const [contacts, setContacts] = useState([
    {
      name: user?.firstName + ' ' + user?.lastName,
      email: user?.email,
      phone: user?.phone || '',
      availability: [],
      timeRanges: []
    }
  ]);

  useEffect(() => {
    if (['admin', 'responsibleClient', 'agentCommercial'].includes(user?.role)) {
      fetchClients();
    }
  }, [user?.role]);

  // Add new useEffect to update contact info when client is selected
  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      // Find the selected client
      const client = clients.find(client => client._id === selectedClient);
      if (client) {
        // Update the first contact with client information
        const updatedContacts = [...contacts];
        updatedContacts[0] = {
          ...updatedContacts[0],
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone || ''
        };
        setContacts(updatedContacts);
      }
    }
  }, [selectedClient, clients]);

  // Add new handler for time ranges
  const handleTimeRangeChange = (contactIndex, rangeIndex, type, newValue) => {
    console.log('Date change:', { contactIndex, rangeIndex, type, newValue, isValid: newValue && newValue > new Date() });

    const updatedContacts = [...contacts];
    updatedContacts[contactIndex].timeRanges[rangeIndex][type] = newValue;

    // Clear any existing error for this field
    const errorKey = `${contactIndex}-${rangeIndex}-${type}`;
    if (dateErrors[errorKey]) {
      setDateErrors(prev => ({
        ...prev,
        [errorKey]: null
      }));
    }

    // Validate the new value
    if (newValue && newValue < new Date()) {
      setDateErrors(prev => ({
        ...prev,
        [errorKey]: t('validation.pastDateError', 'Date cannot be in the past')
      }));
    }

    // If we're updating the 'from' time, ensure 'to' time is after it
    if (type === 'from' && newValue) {
      const currentTo = updatedContacts[contactIndex].timeRanges[rangeIndex].to;
      if (currentTo && newValue >= currentTo) {
        // Set 'to' time to be 1 hour after 'from' time
        const newToTime = new Date(newValue.getTime() + 60 * 60 * 1000);
        updatedContacts[contactIndex].timeRanges[rangeIndex].to = newToTime;
      }
    }

    setContacts(updatedContacts);
  };

  const addTimeRange = (contactIndex) => {
    const updatedContacts = [...contacts];
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const twoHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    updatedContacts[contactIndex].timeRanges.push({
      from: tenMinutesLater,
      to: twoHourLater
    });
    setContacts(updatedContacts);
  };

  const removeTimeRange = (contactIndex, rangeIndex) => {
    const updatedContacts = [...contacts];
    if (updatedContacts[contactIndex].timeRanges.length > 1) {
      updatedContacts[contactIndex].timeRanges.splice(rangeIndex, 1);
      setContacts(updatedContacts);
    }
  };



  // Files state
  const [files, setFiles] = useState([]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Add link field
  const addLink = () => {
    setLinks([...links, { description: '', url: '' }]);
  };

  // Handle link changes
  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...links];
    updatedLinks[index][field] = value;
    setLinks(updatedLinks);
  };

  // Remove link
  const removeLink = (index) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    setLinks(updatedLinks);
  };

  // Add contact field
  const addContact = () => {
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const twoHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setContacts([...contacts, {
      name: '',
      email: '',
      phone: '',
      availability: [],
      timeRanges: [{ from: tenMinutesLater, to: twoHourLater }]
    }]);
  };

  const fetchClients = async () => {
    setLoading(true);

    try {
      let data;

      if (user?.role === 'admin') {
        data = await UserService.getUsersByRole('client'); // Gets all clients
      } else {
        data = await UserService.getClients(user?.id); // Pass the current user's ID
      }

      if (data) {
        setClients(data);
      }
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('clients.fetchError', 'Failed to fetch clients'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    // Basic international phone number regex - adjust based on your requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Handle contact changes
  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);

    // Validate phone number
    if (field === 'phone' && value) {
      const isValid = validatePhoneNumber(value);
      setPhoneErrors(prev => ({
        ...prev,
        [index]: isValid ? null : t('validation.invalidPhone', 'Please enter a valid phone number')
      }));
    } else if (field === 'phone' && !value) {
      // Clear error if phone is empty (since it's optional)
      setPhoneErrors(prev => ({
        ...prev,
        [index]: null
      }));
    }
  };

  // Handle availability changes
  const handleAvailabilityChange = (index, option, isChecked) => {
    const updatedContacts = [...contacts];
    if (isChecked) {
      updatedContacts[index].availability.push(option);
    } else {
      updatedContacts[index].availability = updatedContacts[index].availability
        .filter(item => item !== option);
    }
    setContacts(updatedContacts);
  };

  // Remove contact
  const removeContact = (index) => {
    if (contacts.length > 1) {
      const updatedContacts = [...contacts];
      updatedContacts.splice(index, 1);
      setContacts(updatedContacts);
    } else {
      toast({
        title: t('common.warning', 'Warning'),
        description: t('tickets.contactRemoveError', 'At least one contact is required'),
        variant: "destructive"
      });
    }
  };

  // Handle file upload
  // Add these constants at the top of your component
  const MAX_FILES = 6;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  // Update handleFileChange function
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Check number of files
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: t('common.error', 'Error'),
        description: t('tickets.maxFilesError', 'Maximum 6 files allowed'),
        variant: "destructive"
      });
      return;
    }

    // Filter out oversized files and notify user
    const validFiles = [];
    selectedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('common.error', 'Error'),
          description: `${file.name} ${t('tickets.fileTooLarge', 'is too large. Maximum size is 10MB')}`,
          variant: "destructive"
        });
      } else {
        // Sanitize filename: keep only alphanumeric, dashes, underscores, and dots
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-._]/g, '');
        // Create a new File object with the sanitized name
        const sanitizedFile = new File([file], sanitizedFileName, { type: file.type, lastModified: file.lastModified });
        validFiles.push(sanitizedFile);
      }
    });

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Update the JSX for the files section
  // Remove file
  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  // Save ticket as draft
  const saveAsDraft = async () => {
    setIsSaving(true);
    try {
      const transformedContacts = contacts.map(contact => ({
        ...contact,
        availability: contact.timeRanges.map(range => formatRange(range.from, range.to)),
        timeRanges: undefined
      }));
      // Add client to ticket data
      const ticketData = {
        ...formData,
        links: links.filter(link => link.description && link.url),
        contacts: transformedContacts,
        meetingDateTime,
        status: 'Draft',
        ...(selectedClient && { clientId: selectedClient })// Add selected client ID
      };

      // Always use FormData for consistency
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('ticketData', JSON.stringify(ticketData));

      // Add files
      files.forEach(file => {
        formDataToSubmit.append('files', file);
      });

      // Pass the FormData object to saveDraft
      if (files.length > 0) {
        await TicketService.saveDraft({
          ...ticketData,
          files: files
        });
      } else {
        await TicketService.saveDraft(ticketData);
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('tickets.draftSaveSuccess', 'Ticket saved as draft'),
      });

      navigate('/tickets');
    } catch (error) {
      console.error('Save draft error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('tickets.draftSaveError', 'Failed to save ticket draft'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update submitTicket function
  const submitTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.title || !formData.application || !formData.environment ||
        !formData.requestType || !formData.urgency || !formData.description) {
        throw new Error(t('common.requiredFields', 'Please fill all required fields'));
      }

      if (['admin', 'responsibleClient', 'agentCommercial'].includes(user?.role) && !selectedClient) {
        throw new Error(t('tickets.clientRequired', 'Please select a client'));
      }

      // Validate phone numbers
      const hasPhoneErrors = Object.values(phoneErrors).some(error => error !== null);
      if (hasPhoneErrors) {
        throw new Error(t('validation.fixPhoneErrors', 'Please fix phone number errors before submitting'));
      }

      // Validate that each contact has at least one time range
      const hasInvalidTimeRanges = contacts.some(contact =>
        !contact.timeRanges || contact.timeRanges.length === 0 ||
        contact.timeRanges.some(range => !range.from || !range.to || range.from >= range.to)
      );

      if (hasInvalidTimeRanges) {
        throw new Error(t('validation.invalidTimeRanges', 'Please ensure all time ranges are valid'));
      }

      // Rest of your submit logic...
      const transformedContacts = contacts.map(contact => ({
        ...contact,
        availability: contact.timeRanges.map(range => formatRange(range.from, range.to)),
        timeRanges: undefined
      }));

      const ticketData = {
        ...formData,
        links: links.filter(link => link.description && link.url),
        contacts: transformedContacts,
        meetingDateTime,
        status: 'Sent',
        ...(selectedClient && { clientId: selectedClient })
      };

      if (files.length > 0) {
        const formData = new FormData();
        formData.append('ticketData', JSON.stringify(ticketData));
        files.forEach(file => {
          formData.append('files', file);
        });
        await TicketService.createTicket(formData);
      } else {
        await TicketService.createTicket({ ticketData });
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('tickets.createSuccess', 'Ticket created successfully'),
      });

      navigate('/tickets');

    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('tickets.createError', 'Failed to create ticket'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${rtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => navigate('/tickets')}
          >
            <ArrowLeft className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
            {t('common.back', 'Back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 ml-4">{t('tickets.createTicket', 'Create New Ticket')}</h1>
        </div>

        <form onSubmit={submitTicket} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tickets.generalInfo', 'General Information')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-4 mb-6">
                <div>
                  <Label htmlFor="title">{t('tickets.ticketTitle', 'Title')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="application">{t('tickets.application', 'Application')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="application"
                    name="application"
                    value={formData.application}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="environment">{t('tickets.environment', 'Environment')} <span className="text-red-500">*</span></Label>
                    <Select
                      name="environment"
                      value={formData.environment}
                      onValueChange={(value) => handleSelectChange('environment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select', 'Select...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Production">{t('tickets.environments.production', 'Production')}</SelectItem>
                        <SelectItem value="Test">{t('tickets.environments.test', 'Test')}</SelectItem>
                        <SelectItem value="Development">{t('tickets.environments.development', 'Development')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="requestType">{t('tickets.requestType', 'Request Type')} <span className="text-red-500">*</span></Label>
                    <Select
                      name="requestType"
                      value={formData.requestType}
                      onValueChange={(value) => handleSelectChange('requestType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select', 'Select...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Incident">{t('tickets.types.incident', 'Incident')}</SelectItem>
                        <SelectItem value="Improvement">{t('tickets.types.improvement', 'Improvement')}</SelectItem>
                        <SelectItem value="Other">{t('tickets.types.other', 'Other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="urgency">{t('tickets.urgency.title', 'Urgency')} <span className="text-red-500">*</span></Label>
                    <Select
                      name="urgency"
                      value={formData.urgency}
                      onValueChange={(value) => handleSelectChange('urgency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select', 'Select...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">{t('tickets.urgencyLevels.critical', 'Critical')}</SelectItem>
                        <SelectItem value="High">{t('tickets.urgencyLevels.high', 'High')}</SelectItem>
                        <SelectItem value="Medium">{t('tickets.urgencyLevels.medium', 'Medium')}</SelectItem>
                        <SelectItem value="Low">{t('tickets.urgencyLevels.low', 'Low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tickets.description', 'Description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="description">{t('tickets.detailedDescription', 'Detailed Description')} <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('tickets.descriptionHelperText', 'Describe in detail your request or the issue you encountered.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tickets.attachmentsAndLinks', 'Attachments & Links')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="files">
                    {t('tickets.uploadFiles', 'Upload Files')}
                    <span className="text-sm text-gray-500">
                      ({t('tickets.maxFiles', '{{current}}/{{max}} files', { current: files.length, max: MAX_FILES })})
                    </span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className={`flex items-center ${rtl ? 'space-x-reverse' : ''} space-x-2`}>
                      <Input
                        id="files"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        className="flex-1"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        disabled={files.length >= MAX_FILES}
                      />
                    </div>

                    {files.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium mb-2">{t('tickets.selectedFiles', 'Selected files')}:</h3>
                        <ul className="space-y-1">
                          {files.map((file, index) => (
                            <li key={index} className={`flex items-center justify-between bg-gray-50 p-2 rounded text-sm ${rtl ? 'flex-row-reverse' : ''}`}>
                              <div className="flex flex-col">
                                <span>{file.name}</span>
                                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {t('tickets.fileRestrictions', 'Maximum file size: 10MB per file. Allowed types: Images, PDF, DOC, DOCX, XLS, XLSX')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>{t('tickets.links', 'Links')}</Label>
                  {links.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <Input
                          placeholder={t('tickets.linkDescription', 'Description')}
                          value={link.description}
                          onChange={(e) => handleLinkChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className={`flex items-center ${rtl ? 'space-x-reverse' : ''} gap-2`}>
                        <Input
                          placeholder="URL"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`mt-2 ${rtl ? 'flex flex-row-reverse' : ''}`}
                    onClick={addLink}
                  >
                    <Plus className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                    {t('tickets.addLink', 'Add Link')}
                  </Button>
                </div>

                <div>
                  <Label htmlFor="driveLink">{t('tickets.googleDriveLink', 'Google Drive Link')}</Label>
                  <div className="mt-1">
                    <Input
                      id="driveLink"
                      name="driveLink"
                      value={formData.driveLink}
                      onChange={handleChange}
                      placeholder={t('tickets.driveSharePlaceholder', 'Please share with support_share@liadtech.com')}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('tickets.driveShareNote', 'Note: Make sure the Drive link is shared with support_share@liadtech.com')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tickets.meetingAvailability', 'Meeting Availability')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Client selection - moved outside contacts.map */}
              {['admin', 'responsibleClient', 'agentCommercial'].includes(user?.role) && (
                <div className="mb-4">
                  <Label htmlFor="client">{t('tickets.selectClient', 'Select Client')}</Label>
                  <Select
                    name="client"
                    value={selectedClient}
                    onValueChange={(value) => setSelectedClient(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select', 'Select...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="" disabled>
                          {t('common.loading', 'Loading...')}
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {`${client.firstName} ${client.lastName}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Single contacts.map */}
              {contacts.map((contact, contactIndex) => (
                <div key={contactIndex} className="mb-6 p-4 border border-gray-200 rounded-md">
                  {/* Contact header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">{t('tickets.contact', 'Contact')} {contactIndex + 1}</h3>
                    {contactIndex > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={rtl ? 'flex flex-row-reverse' : ''}
                        onClick={() => removeContact(contactIndex)}
                      >
                        <Trash2 className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                        {t('common.delete', 'Delete')}
                      </Button>
                    )}
                  </div>

                  {/* Contact information fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>{t('users.name', 'Name')}</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) => handleContactChange(contactIndex, 'name', e.target.value)}
                        required={contactIndex === 0}
                      />
                    </div>
                    <div>
                      <Label>{t('auth.email', 'Email')}</Label>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleContactChange(contactIndex, 'email', e.target.value)}
                        required={contactIndex === 0}
                      />
                    </div>
                    <div>
                      <Label>{t('users.phone', 'Phone')} ({t('common.optional', 'optional')})</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => handleContactChange(contactIndex, 'phone', e.target.value)}
                        className={phoneErrors[contactIndex] ? 'border-red-500' : ''}
                      />
                      {phoneErrors[contactIndex] && (
                        <p className="text-red-500 text-sm mt-1">{phoneErrors[contactIndex]}</p>
                      )}
                    </div>
                  </div>

                  {/* Time ranges section */}
                  <div>
                    <Label className="mb-2 block">{t('tickets.meetingAvailability', 'Meeting Availability')}</Label>
                    <div className="space-y-4">
                      {contact.timeRanges?.map((timeRange, rangeIndex) => (
                        <div key={rangeIndex} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">
                              {t('tickets.timeRange', 'Time Range')} {rangeIndex + 1}
                            </h4>
                            {contact.timeRanges.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeRange(contactIndex, rangeIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>{t('tickets.from', 'From')}</Label>
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                  label={t('tickets.selectDateTime', 'Select Date & Time')}
                                  value={timeRange.from}
                                  onChange={(newValue, keyboardInputValue) => {
                                    // Handle invalid input gracefully
                                    if (newValue === null && keyboardInputValue) {
                                      console.log('Invalid date input:', keyboardInputValue);
                                      return;
                                    }
                                    handleTimeRangeChange(contactIndex, rangeIndex, 'from', newValue);
                                  }}
                                  onError={(error) => {
                                    console.log('DateTimePicker error:', error);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      fullWidth
                                      error={false}
                                      sx={{
                                        '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#d1d5db !important',
                                        },
                                      }}
                                    />
                                  )}
                                  minDateTime={new Date()}
                                />
                              </LocalizationProvider>
                            </div>

                            <div>
                              <Label>{t('tickets.to', 'To')}</Label>
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                  label={t('tickets.selectDateTime', 'Select Date & Time')}
                                  value={timeRange.to}
                                  onChange={(newValue) => handleTimeRangeChange(contactIndex, rangeIndex, 'to', newValue)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      fullWidth
                                      error={false}
                                      sx={{
                                        '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#d1d5db !important',
                                        },
                                      }}
                                    />
                                  )}
                                  minDateTime={
                                    timeRange.from
                                      ? new Date(timeRange.from.getTime() + 60000)
                                      : new Date()
                                  }
                                />
                              </LocalizationProvider>
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeRange(contactIndex)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('tickets.addTimeRange', 'Add Time Range')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className={rtl ? 'flex flex-row-reverse' : ''}
                onClick={addContact}
              >
                <Plus className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                {t('tickets.addAnotherContact', 'Add Another Contact')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('tickets.additionalInfo', 'Additional Information')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="additionalInfo">{t('tickets.additionalComments', 'Additional Comments or Notes')}</Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className={`flex ${rtl ? 'justify-start space-x-reverse' : 'justify-end'} space-x-4`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tickets')}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || isSaving}
              onClick={saveAsDraft}
            >
              {isSaving ? (
                <>
                  <Loader2 className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('tickets.saveDraft', 'Save Draft')
              )}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t('common.sending', 'Sending...')}
                </>
              ) : (
                t('tickets.submitTicket', 'Submit Ticket')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}