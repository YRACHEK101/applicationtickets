// src/pages/ClientDashboard.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { TicketService } from '../api/TicketService';
import api from '../api/api';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';

import {
  Building,
  Ticket,
  Clock,
  Calendar,
  FileText,
  Upload,
  CreditCard,
  Plus,
  FileUp,
  ExternalLink
} from 'lucide-react';
import path from 'path';

// Define types for company and tickets data
interface CompanyContact {
  name: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

interface CompanyAddress {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

interface CompanyDocument {
  _id: string;
  name: string;
  fileType: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface AvailabilitySlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface Company {
  _id: string;
  name: string;
  address: CompanyAddress;
  contacts: CompanyContact[];
  billingMethod: 'hourly' | 'perTask' | 'subscription';
  contactPerson: {
    name: string;
    position?: string;
    email: string;
    phone: string;
  };
  availabilitySlots: AvailabilitySlot[];
  documents: CompanyDocument[];
  commercialAgent?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Ticket {
  _id: string;
  number: string;
  title: string;
  status: string;
  urgency: string;
  requestType: string;
  application: string;
  createdAt: string;
  updatedAt: string;
}

interface Meeting {
  _id?: string;
  title: string;
  dateTime: string;
  meetingLink: string;
  agenda?: string;
  attendees?: string[];
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [companyLoading, setCompanyLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [updatingBilling, setUpdatingBilling] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [pendingActions, setPendingActions] = useState<Ticket[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  // Document upload state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Billing method dialog state
  const [newBillingMethod, setNewBillingMethod] = useState('');
  const [showBillingDialog, setShowBillingDialog] = useState(false);

  // Availability management state
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState<Partial<AvailabilitySlot>>({
    day: '',
    startTime: '',
    endTime: ''
  });
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  useEffect(() => {
    // Fetch company data if user is logged in and has company ID
    if (user) {
      fetchCompanyData();
      fetchTickets();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    setCompanyLoading(true);

    try {
      // Fetch user profile to get company ID
      const userResponse = await api.get('v1/auth/me');

      if (userResponse.data.company) {
        // Fetch company details
        const companyId = userResponse.data.company._id || userResponse.data.company; // handles both Object or ID

        const companyResponse = await api.get(`v1/company/${companyId}`);
        setCompany(companyResponse.data);

        // Set initial availability slots from company data
        if (companyResponse.data.availabilitySlots) {
          setAvailabilitySlots(companyResponse.data.availabilitySlots);
        }

        // Set initial billing method
        if (companyResponse.data.billingMethod) {
          setNewBillingMethod(companyResponse.data.billingMethod);
        }

        // Fetch upcoming meetings
        try {
          // This would be a separate endpoint in a real application
          // Here, we'll mock some meetings data
          const mockMeetings = [
            {
              _id: '1',
              title: 'Weekly Progress Review',
              dateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
              meetingLink: 'https://teams.microsoft.com/meeting/123',
              agenda: 'Review project progress and discuss next steps'
            },
            {
              _id: '2',
              title: 'Technical Consultation',
              dateTime: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
              meetingLink: 'https://teams.microsoft.com/meeting/456',
              agenda: 'Discuss technical requirements for new features'
            }
          ];

          setUpcomingMeetings(mockMeetings);
        } catch (meetingsError) {
          console.error('Error fetching meetings:', meetingsError);
        }
      } else {
        toast({
          title: t('error'),
          description: t('companies.noCompanyAssociated'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: t('error'),
        description: t('companies.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);

    try {
      // Fetch client tickets
      const ticketsResponse = await TicketService.getClientTickets();
      setTickets(ticketsResponse);

      // Get recent tickets (5 most recent)
      const sortedTickets = [...ticketsResponse].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setRecentTickets(sortedTickets.slice(0, 5));

      // Get pending actions (tickets waiting for client validation)
      const pending = ticketsResponse.filter(
        ticket => ticket.status === 'ClientValidation'
      );
      setPendingActions(pending);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: t('error'),
        description: t('tickets.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentFile(file);

      setDocumentName(file.name);

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size exceeds the 10MB limit.',
          variant: 'destructive',
        });
        setDocumentFile(null);
      }
    }
  };

  const uploadDocument = async () => {
    if (!documentFile || !documentName || !company) {
      toast({
        title: 'Error',
        description: 'Please select a file and provide a document name.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('name', documentName);
      formData.append('companyName', company.name); // Include the company name

      await api.post(`/v1/company/${company._id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Document uploaded successfully.',
      });

      // Reset the form and refresh the company data
      setDocumentFile(null);
      setDocumentName('');
      fetchCompanyData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload the document.',
        variant: 'destructive',
      });
    } finally {
      setUploadingDocument(false);
    }
  };
  const updateBillingMethod = async () => {
    if (!newBillingMethod || !company) {
      return;
    }

    setUpdatingBilling(true);

    try {
      await api.put(`v1/company/${company._id}/billing`, {
        billingMethod: newBillingMethod
      });

      toast({
        title: t('success'),
        description: t('companies.billingMethod.updateSuccess'),
      });

      // Refresh company data and close dialog
      setShowBillingDialog(false);
      fetchCompanyData();
    } catch (error) {
      console.error('Error updating billing method:', error);
      toast({
        title: t('error'),
        description: t('companies.billingMethod.updateError'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingBilling(false);
    }
  };

  const addAvailabilitySlot = () => {
    if (!newSlot.day || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: t('error'),
        description: t('companies.availability.missingInfo'),
        variant: 'destructive',
      });
      return;
    }

    setAvailabilitySlots([...availabilitySlots, newSlot as AvailabilitySlot]);

    // Reset new slot form
    setNewSlot({
      day: '',
      startTime: '',
      endTime: ''
    });
  };

  const removeAvailabilitySlot = (index: number) => {
    const updatedSlots = [...availabilitySlots];
    updatedSlots.splice(index, 1);
    setAvailabilitySlots(updatedSlots);
  };

  const updateAvailability = async () => {
    if (!company) return;

    setUpdatingAvailability(true);

    try {
      await api.post(`v1/company/${company._id}/availability`, {
        availabilitySlots
      });

      toast({
        title: t('success'),
        description: t('companies.availability.updateSuccess'),
      });

      // Close dialog and refresh data
      setShowAvailabilityDialog(false);
      fetchCompanyData();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: t('error'),
        description: t('companies.availability.updateError'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
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
        return 'bg-indigo-100 text-indigo-800';
      case 'Validated':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFilenameFromPath = (filePath: string): string => {
    // Handle both forward slashes and backslashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    return parts[parts.length - 1];
  };

  const downloadDocument = async (companyId: string, filePath: string) => {
    try {

      // Extract just the filename from the path
      const filename = getFilenameFromPath(filePath);

      const response = await api.get(`/v1/company/${companyId}/documents/${filename}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to download document.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('clientDashboard.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  {t('clientDashboard.companyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ) : company ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{company.name}</h3>
                      {company.address && (
                        <p className="text-gray-600">
                          {company.address.street}, {company.address.city}, {company.address.state} {company.address.zipCode}, {company.address.country}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('companies.contactPerson.title')}</h4>
                        <p>{company.contactPerson.name}</p>
                        <p>{company.contactPerson.position}</p>
                        <p className="text-sm text-gray-600">{company.contactPerson.email}</p>
                        <p className="text-sm text-gray-600">{company.contactPerson.phone}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('companies.commercialAgent')}</h4>
                        {company.commercialAgent ? (
                          <div>
                            <p>{company.commercialAgent.firstName} {company.commercialAgent.lastName}</p>
                            <p className="text-sm text-gray-600">{company.commercialAgent.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">No commercial agent assigned</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('companies.billingMethod.title')}</h4>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <Badge className="bg-blue-100 text-blue-800">
                            {company.billingMethod === 'hourly' && t('companies.billingMethod.hourly')}
                            {company.billingMethod === 'perTask' && t('companies.billingMethod.perTask')}
                            {company.billingMethod === 'subscription' && t('companies.billingMethod.subscription')}
                          </Badge>
                        </div>

                        <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CreditCard className="h-4 w-4 mr-2" />
                              {t('clientDashboard.changeBillingMethod')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t('companies.billingMethod.title')}</DialogTitle>
                              <DialogDescription>
                                {t('companies.billingMethod.selectNew')}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                              <Select
                                value={newBillingMethod}
                                onValueChange={setNewBillingMethod}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('companies.billingMethod.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hourly">{t('companies.billingMethod.hourly')}</SelectItem>
                                  <SelectItem value="perTask">{t('companies.billingMethod.perTask')}</SelectItem>
                                  <SelectItem value="subscription">{t('companies.billingMethod.subscription')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setShowBillingDialog(false)}
                              >
                                {t('common.cancel')}
                              </Button>
                              <Button
                                onClick={updateBillingMethod}
                                disabled={updatingBilling}
                              >
                                {updatingBilling ? t('common.saving') : t('common.save')}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('companies.availability.title')}</h4>
                      {company.availabilitySlots && company.availabilitySlots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {company.availabilitySlots.map((slot, index) => (
                            <Badge key={index} className="bg-gray-100 text-gray-800">
                              {slot.day} {slot.startTime}-{slot.endTime}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{t('companies.availability.none')}</p>
                      )}

                      <div className="mt-2">
                        <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Clock className="h-4 w-4 mr-2" />
                              {t('clientDashboard.availabilityManagement')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{t('companies.availability.title')}</DialogTitle>
                              <DialogDescription>
                                {t('companies.availability.description')}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                              {/* Current availability slots */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">{t('companies.availability.current')}</h4>
                                {availabilitySlots.length > 0 ? (
                                  <div className="space-y-2">
                                    {availabilitySlots.map((slot, index) => (
                                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span>
                                          {slot.day} {slot.startTime}-{slot.endTime}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeAvailabilitySlot(index)}
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">{t('companies.availability.none')}</p>
                                )}
                              </div>

                              <Separator />

                              {/* Add new slot */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">{t('companies.availability.addSlot')}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  <Select
                                    value={newSlot.day}
                                    onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('companies.availability.day')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Monday">{t('Monday')}</SelectItem>
                                      <SelectItem value="Tuesday">{t('Tuesday')}</SelectItem>
                                      <SelectItem value="Wednesday">{t('Wednesday')}</SelectItem>
                                      <SelectItem value="Thursday">{t('Thursday')}</SelectItem>
                                      <SelectItem value="Friday">{t('Friday')}</SelectItem>
                                      <SelectItem value="Saturday">{t('Saturday')}</SelectItem>
                                      <SelectItem value="Sunday">{t('Sunday')}</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Input
                                        type="time"
                                        value={newSlot.startTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                        placeholder={t('companies.availability.startTime')}
                                      />
                                    </div>
                                    <div>
                                      <Input
                                        type="time"
                                        value={newSlot.endTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                        placeholder={t('companies.availability.endTime')}
                                      />
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    type="button"
                                    onClick={addAvailabilitySlot}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('companies.availability.addSlot')}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setShowAvailabilityDialog(false)}
                              >
                                {t('common.cancel')}
                              </Button>
                              <Button
                                onClick={updateAvailability}
                                disabled={updatingAvailability}
                              >
                                {updatingAvailability ? t('common.saving') : t('common.save')}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-600">{t('companies.noCompanyData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Ticket Overview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                  {t('clientDashboard.ticketOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <Tabs defaultValue="recent" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="recent">{t('tickets.recentTickets')}</TabsTrigger>
                      <TabsTrigger value="pending">{t('tickets.pendingActions')}</TabsTrigger>
                      <TabsTrigger value="all">{t('tickets.allTickets')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent">
                      {recentTickets.length > 0 ? (
                        <div className="space-y-4">
                          {recentTickets.map((ticket) => (
                            <div key={ticket._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                              <div>
                                <div className="font-medium">{ticket.title}</div>
                                <div className="text-sm text-gray-600">
                                  {ticket.number} • {ticket.application}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusBadgeClass(ticket.status)}>
                                  {ticket.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                                >
                                  {t('common.view')}
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              onClick={() => navigate('/tickets')}
                            >
                              {t('dashboard.viewAll')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-600 py-4">{t('tickets.noTicketsFound')}</p>
                      )}
                    </TabsContent>

                    <TabsContent value="pending">
                      {pendingActions.length > 0 ? (
                        <div className="space-y-4">
                          {pendingActions.map((ticket) => (
                            <div key={ticket._id} className="flex justify-between items-center p-3 bg-indigo-50 rounded-md hover:bg-indigo-100">
                              <div>
                                <div className="font-medium">{ticket.title}</div>
                                <div className="text-sm text-gray-600">
                                  {ticket.number} • {ticket.application}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-indigo-100 text-indigo-800">
                                  {t('tickets.status.clientValidation')}
                                </Badge>
                                <Button
                                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                                >
                                  {t('tickets.validate')}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600 py-4">{t('tickets.noPendingActions')}</p>
                      )}
                    </TabsContent>

                    <TabsContent value="all">
                      {tickets.length > 0 ? (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium">{t('tickets.ticketNumber')}</th>
                                  <th className="text-left py-2 px-3 font-medium">{t('tickets.ticketTitle')}</th>
                                  <th className="text-left py-2 px-3 font-medium">{t('tickets.status')}</th>
                                  <th className="text-left py-2 px-3 font-medium">{t('tickets.createdAt')}</th>
                                  <th className="text-left py-2 px-3 font-medium">{t('common.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tickets.map((ticket) => (
                                  <tr key={ticket._id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-3">{ticket.number}</td>
                                    <td className="py-2 px-3">{ticket.title}</td>
                                    <td className="py-2 px-3">
                                      <Badge className={getStatusBadgeClass(ticket.status)}>
                                        {ticket.status}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                    <td className="py-2 px-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/tickets/${ticket._id}`)}
                                      >
                                        {t('common.view')}
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex justify-center">
                            <Button
                              onClick={() => navigate('/tickets/create')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('tickets.createTicket')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-600 mb-4">{t('tickets.noTicketsFound')}</p>
                          <Button
                            onClick={() => navigate('/tickets/create')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('tickets.createTicket')}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Document Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  {t('clientDashboard.documentManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : company ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{t('companies.documents.title')}</h4>
                      {company.documents && company.documents.length > 0 ? (
                        <div className="space-y-2">
                          {company.documents.map((doc) => (
                            <div key={doc._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <div className="flex items-center min-w-0 flex-1 mr-2">
                                <FileText className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate" title={doc.name}>
                                    {doc.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0"
                                onClick={() => downloadDocument(company._id, doc.filePath)}
                              >
                                {t('companies.documents.download')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{t('companies.documents.none')}</p>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <FileUp className="h-4 w-4 mr-2" />
                          {t('clientDashboard.uploadNewDocument')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('companies.documents.uploadDocument')}</DialogTitle>
                          <DialogDescription>
                            {t('companies.documents.sizeLimit')}
                            <br />
                            {t('companies.documents.allowedTypes')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t('companies.documents.name')}
                            </label>
                            <Input
                              value={documentName}
                              onChange={(e) => setDocumentName(e.target.value)}
                              placeholder={t('companies.documents.namePlaceholder')}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t('companies.documents.selectFile')}
                            </label>
                            <Input
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                            />
                          </div>

                          {documentFile && (
                            <div className="bg-gray-50 p-2 rounded text-sm">
                              <p>
                                <strong>{t('companies.documents.selectedFile')}:</strong> {documentFile.name}
                              </p>
                              <p>
                                <strong>{t('companies.documents.fileSize')}:</strong>{' '}
                                {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDocumentFile(null);
                              setDocumentName('');
                            }}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            onClick={uploadDocument}
                            disabled={!documentFile || !documentName || uploadingDocument}
                          >
                            {uploadingDocument ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                {t('companies.documents.uploading')}
                              </>
                            ) : (
                              t('companies.documents.upload')
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <p className="text-center text-gray-600">{t('companies.noCompanyData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  {t('clientDashboard.meetings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMeetings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingMeetings.map((meeting) => (
                          <div key={meeting._id} className="p-3 border rounded-md">
                            <div className="font-medium">{meeting.title}</div>
                            <div className="text-sm text-gray-600 mb-2">
                              {formatDateTime(meeting.dateTime)}
                            </div>
                            {meeting.agenda && (
                              <div className="text-sm mb-2">
                                <strong>{t('tickets.meetings.agenda')}:</strong> {meeting.agenda}
                              </div>
                            )}
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(meeting.meetingLink, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {t('tickets.meetings.join')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-600">{t('tickets.meetings.none')}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" onClick={() => navigate('/tickets/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('tickets.createTicket')}
                  </Button>

                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/tickets')}>
                    <Ticket className="h-4 w-4 mr-2" />
                    {t('tickets.viewTickets')}
                  </Button>

                  {pendingActions.length > 0 && (
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => navigate('/tickets?status=ClientValidation')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {t('tickets.pendingValidations')} ({pendingActions.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}