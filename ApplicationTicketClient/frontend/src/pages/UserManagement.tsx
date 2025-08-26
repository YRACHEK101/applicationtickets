import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import api from '../api/api';
import CreateUserDialog from '../components/users/CreateUserDialog';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

// Icons
import {
  Loader2,
  Search,
  Trash2,
  RefreshCw,
  PencilLine,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Filter,
  Building,
  Briefcase,
  Users,
} from 'lucide-react';

// Interfaces
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: number | null;
  team?: string;
  company?: {
    _id: string;
    name: string;
  } | string | null;
  isSuspended?: boolean;
  preferredLanguage?: string;
  createdAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  notifications?: any[];
  __v?: number;
  groupLeader?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  projectManager?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  responsibleTester?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface Company {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  billingMethod: 'hourly' | 'perTask' | 'subscription';
  contactPerson: {
    name: string;
    position?: string;
    email: string;
    phone: string;
  };
  commercialAgent?: string;
  createdAt: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  password: string;
  confirmPassword: string;
  company?: string;
  preferredLanguage: string;
  projectManager?: string;
  groupLeader?: string;
  responsibleTester?: string;
}

interface UserFilters {
  role: string;
  company: string;
  status: string;
  searchTerm: string;
}


export default function UserManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State for companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [companyFilters, setCompanyFilters] = useState({
    searchTerm: '',
    billingMethod: 'all',
  });
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [groupLeaders, setGroupLeaders] = useState<User[]>([]);
  const [responsibleTesters, setResponsibleTesters] = useState<User[]>([]);


  // State for filters
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    company: 'all',
    status: 'all',
    searchTerm: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState('workers');

  // State for user deletion/suspension
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phone: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'en',
  });

  // State for company creation
  const [isCreateCompanyDialogOpen, setIsCreateCompanyDialogOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactPerson: {
      name: '',
      position: '',
      email: '',
      phone: ''
    },
    billingMethod: 'hourly' as 'hourly' | 'perTask' | 'subscription'
  });
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [isViewCompanyDialogOpen, setIsViewCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);


  // Fetch users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (['admin', 'agentCommercial'].includes(user?.role)) {
          await fetchCompanies();

          const [projectManagersList, groupLeadersList, responsibleTestersList] = await Promise.all([
            fetchUsersByRole('projectManager'),
            fetchUsersByRole('groupLeader'),
            fetchUsersByRole('responsibleTester')
          ]);

          setProjectManagers(projectManagersList);
          setGroupLeaders(groupLeadersList);
          setResponsibleTesters(responsibleTestersList);
        }

        await fetchUsers();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);
  const fetchUsersByRole = async (role: string) => {
    try {
      const response = await api.get('/v1/user');
      return response.data.filter(user => user.role === role);
    } catch (error) {
      console.error(`Error fetching ${role} users:`, error);
      return [];
    }
  };

  // Apply filters when filter state or users change
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users];

      // Filter by view mode (workers/clients)
      if (viewMode === 'workers') {
        filtered = filtered.filter(user =>
          ['admin', 'agentCommercial', 'responsibleClient', 'projectManager', 'groupLeader', 'developer', 'responsibleTester', 'tester'].includes(user.role)
        );
      } else if (viewMode === 'clients') {
        filtered = filtered.filter(user => user.role === 'client');
      }

      // Advanced search by firstName, lastName, and email
      if (filters.searchTerm) {
        const terms = filters.searchTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
        if (terms.length === 1) {
          // Single term: Match firstName, lastName, or email
          filtered = filtered.filter(user =>
            user.firstName.toLowerCase().includes(terms[0]) ||
            user.lastName.toLowerCase().includes(terms[0]) ||
            user.email.toLowerCase().includes(terms[0])
          );
        } else if (terms.length >= 2) {
          // Two or more terms: Match combinations of firstName and lastName
          filtered = filtered.filter(user =>
            (user.firstName.toLowerCase().includes(terms[0]) && user.lastName.toLowerCase().startsWith(terms[1])) ||
            (user.lastName.toLowerCase().includes(terms[0]) && user.firstName.toLowerCase().startsWith(terms[1]))
          );
        }
      }

      // Filter by role
      if (filters.role !== 'all') {
        filtered = filtered.filter(user => user.role === filters.role);
      }

      // Filter by company
      // Filter by company
      if (filters.company !== 'all') {
        filtered = filtered.filter(user => {
          const companyId = getCompanyId(user.company);
          return companyId === filters.company;
        });
      }

      // Filter by status
      if (filters.status !== 'all') {
        const isSuspended = filters.status === 'suspended';
        filtered = filtered.filter(user => user.isSuspended === isSuspended);
      }

      setFilteredUsers(filtered);
    }
  }, [filters, users, viewMode]);
  useEffect(() => {
    let filtered = [...companies];

    if (companyFilters.searchTerm) {
      const term = companyFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.contactPerson.email.toLowerCase().includes(term) ||
        company.address.city.toLowerCase().includes(term)
      );
    }

    if (companyFilters.billingMethod !== 'all') {
      filtered = filtered.filter(company =>
        company.billingMethod === companyFilters.billingMethod
      );
    }

    setFilteredCompanies(filtered);
  }, [companyFilters, companies]);

  const getCompanyName = (userCompany: { _id: string; name: string } | string | undefined | null) => {
    if (!userCompany) return t('users.noCompany');

    // If it's already a populated object with name
    if (typeof userCompany === 'object' && userCompany.name) {
      return userCompany.name;
    }

    // If it's just an ID string, find the company in the companies array
    if (typeof userCompany === 'string') {
      const company = companies.find(c => c._id === userCompany);
      return company?.name || t('users.noCompany');
    }

    return t('users.noCompany');
  };

  const getCompanyId = (userCompany: { _id: string; name: string } | string | undefined | null) => {
    if (!userCompany) return '';

    // If it's a populated object, return the _id
    if (typeof userCompany === 'object' && userCompany._id) {
      return userCompany._id;
    }

    // If it's already just an ID string
    if (typeof userCompany === 'string') {
      return userCompany;
    }

    return '';
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/user');
      const allUsers = response.data;

      let visibleUsers = allUsers;

      const currentUserRole = user?.role;
      if (currentUserRole === 'agentCommercial') {
        visibleUsers = allUsers.filter(user => user.role?.toLowerCase() === 'client');
      }
      setUsers(visibleUsers);
      setFilteredUsers(visibleUsers);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('users.fetchError'),
        variant: 'destructive',
      });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies from the API
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const endpoint = '/v1/company';

      const response = await api.get(endpoint);
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('companies.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return; // Ignore non-numeric input
    }
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Clear dependent fields when role changes
      if (name === 'role') {
        if (value !== 'groupLeader') newData.projectManager = '';
        if (value !== 'developer') newData.groupLeader = '';
        if (value !== 'tester') newData.responsibleTester = '';
      }
      return newData;
    });
  };

  // Update a filter value
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      role: 'all',
      company: 'all',
      status: 'all',
      searchTerm: '',
    });
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      phone: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: 'en',
    });
    setShowPassword(false);
  };

  // Set up form for editing a user
  const setupEditForm = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone?.toString() || '',
      password: '',
      confirmPassword: '',
      company: getCompanyId(user.company),
      preferredLanguage: user.preferredLanguage || 'en',
      // Handle role-specific fields properly
      projectManager: getRoleFieldId(user.projectManager) || '',
      groupLeader: getRoleFieldId(user.groupLeader) || '',
      responsibleTester: getRoleFieldId(user.responsibleTester) || '',
    });
    setIsEditDialogOpen(true);
  };

  // Set up dialog for viewing a user
  const setupViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };
  // Handle user update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast({
        title: t('common.error'),
        description: t('users.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    // If password is provided, check confirmation
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('users.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }
    if (formData.phone && !/^\d+$/.test(formData.phone)) {
      toast({
        title: t('common.error'),
        description: t('users.invalidPhone'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Create update data (exclude password if not provided)
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      projectManager: formData.projectManager || null,
      groupLeader: formData.groupLeader || null,
      responsibleTester: formData.responsibleTester || null,
      phone: formData.phone,
      company: formData.company === "No company" ? null : formData.company,
      preferredLanguage: formData.preferredLanguage,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      await api.put(`/v1/user/${selectedUser._id}`, updateData);

      toast({
        title: t('common.success'),
        description: t('users.updateSuccess'),
      });

      // Reset form and close dialog
      resetFormData();
      setIsEditDialogOpen(false);
      setSelectedUser(null);

      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('users.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete._id === user.id) {
      toast({
        title: t('common.error'),
        description: t('users.cannotDeleteSelf'),
        variant: 'destructive',
      });
      setUserToDelete(null);
      return;
    }

    setIsProcessing(true);

    try {
      await api.delete(`/v1/user/${userToDelete._id}`);

      toast({
        title: t('common.success'),
        description: t('users.deleteSuccess'),
      });

      // Remove deleted user locally without fetching all again
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userToDelete._id));

    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('users.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setUserToDelete(null);
    }
  };

  // Handle user suspension/activation
  const handleToggleSuspension = async () => {
    if (!userToSuspend) return;

    // Prevent self-suspension
    if (userToSuspend._id === user.id) {
      toast({
        title: t('common.error'),
        description: t('users.cannotSuspendSelf'),
        variant: 'destructive',
      });
      setUserToSuspend(null);
      return;
    }

    setIsProcessing(true);

    try {
      const newSuspendedStatus = !userToSuspend.isSuspended;
      await api.put(`v1/auth/suspend/${userToSuspend._id}`, { isSuspended: newSuspendedStatus });

      toast({
        title: t('common.success'),
        description: newSuspendedStatus
          ? t('users.suspendSuccess')
          : t('users.activateSuccess'),
      });

      // Refresh user list
      fetchUsers();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('users.suspendError'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setUserToSuspend(null);
    }
  };

  //function for getion the company data
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!companyFormData.name || !companyFormData.contactPerson.email) {
      toast({
        title: 'Error',
        description: 'Please provide all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', companyFormData.name);
    formData.append('address', JSON.stringify(companyFormData.address));
    formData.append('contactPerson', JSON.stringify(companyFormData.contactPerson));
    formData.append('billingMethod', companyFormData.billingMethod);

    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/v1/company', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Company created successfully.',
      });

      // Reset form and close dialog
      setCompanyFormData({
        name: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        contactPerson: {
          name: '',
          position: '',
          email: '',
          phone: '',
        },
        billingMethod: 'hourly',
      });
      setUploadedFiles([]);
      setIsCreateCompanyDialogOpen(false);

      // Refresh company list
      fetchCompanies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create company.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = uploadedFiles.length + newFiles.length;

    // Check if the total number of files exceeds the limit
    if (totalFiles > 5) {
      toast({
        title: t('common.error'),
        description: t('companies.maxFilesExceeded', { maxFiles: 5 }),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    const validFiles = newFiles.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('common.error'),
          description: t('companies.fileTooLarge', { maxSize: '10 MB' }),
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Add these functions after handleCreateCompany
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    setIsProcessing(true);
    try {
      await api.delete(`/v1/company/${companyToDelete._id}`);
      setCompanies(prev => prev.filter(c => c._id !== companyToDelete._id));
      toast({ title: t('common.success'), description: t('companies.deleteSuccess') });
    } catch (error) {
      toast({ title: t('common.error'), description: t('companies.deleteError'), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setCompanyToDelete(null);
    }
  };

  const setupEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setCompanyFormData({
      name: company.name,
      address: company.address,
      contactPerson: company.contactPerson,
      billingMethod: company.billingMethod
    });
    setIsEditCompanyDialogOpen(true);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', companyFormData.name);
      formData.append('address', JSON.stringify(companyFormData.address));
      formData.append('contactPerson', JSON.stringify(companyFormData.contactPerson));
      formData.append('billingMethod', companyFormData.billingMethod);

      // Add files to remove
      if (companyFormData.filesToRemove) {
        formData.append('filesToRemove', JSON.stringify(companyFormData.filesToRemove));
      }

      // Add new files
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await api.put(`/v1/company/${selectedCompany._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({ title: t('common.success'), description: t('companies.updateSuccess') });
      fetchCompanies();
      setIsEditCompanyDialogOpen(false);
      setUploadedFiles([]);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('companies.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setCompanyFormData((prev) => ({
      ...prev,
      filesToRemove: [...(prev.filesToRemove || []), fileId],
    }));

    // Optionally, update the UI to hide the file immediately
    setSelectedCompany((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: prev.documents.filter((doc) => doc._id !== fileId),
      };
    });
  };
  // Format role for display
  const formatRole = (role: string) => {
    return t(`users.roles.${role}`);
  };

  // Get CSS class for role badge
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'agentCommercial':
        return 'bg-green-100 text-green-800';
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'responsibleClient':
        return 'bg-yellow-100 text-yellow-800';
      // case 'commercial':
      //   return 'bg-orange-100 text-orange-800';
      case 'projectManager':
        return 'bg-teal-100 text-teal-800';
      case 'groupLeader':
        return 'bg-indigo-100 text-indigo-800';
      case 'developer':
        return 'bg-pink-100 text-pink-800';
      case 'responsibleTester':
        return 'bg-orange-100 text-orange-800';
      case 'tester':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get CSS class for status badge
  const getStatusColor = (isSuspended: boolean) => {
    return isSuspended
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800';
  };

  // Get available roles based on user's role
  const getAvailableRoles = () => {
    if (user?.role === 'admin') {
      return [
        { value: 'admin', label: t('users.roles.admin') },
        { value: 'responsibleClient', label: t('users.roles.responsibleClient') },
        { value: 'client', label: t('users.roles.client') },
        { value: 'agentCommercial', label: t('users.roles.agentCommercial') },
        { value: 'projectManager', label: t('users.roles.projectManager') },
        { value: 'groupLeader', label: t('users.roles.groupLeader') },
        { value: 'developer', label: t('users.roles.developer') },
        { value: 'responsibleTester', label: t('users.roles.responsibleTester') },
        { value: 'tester', label: t('users.roles.tester') },
      ];
    } else if (user?.role === 'agentCommercial') {
      return [
        { value: 'client', label: t('users.roles.client') },
      ];
    }
    return [];
  };

  // If user doesn't have permission, show access denied
  if (!['admin', 'agentCommercial'].includes(user?.role)) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('common.accessDenied')}</CardTitle>
            <CardDescription>
              {t('common.noPermission')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              {t('users.adminOnly')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              {t('common.backToDashboard')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getRoleFieldId = (field: string | { _id: string; firstName?: string; lastName?: string; email?: string } | null | undefined): string => {
    if (!field) return '';

    // Handle populated object format from your API
    if (typeof field === 'object' && field._id) {
      return field._id;
    }

    // Handle string format (just ID)
    if (typeof field === 'string') {
      return field;
    }

    return '';
  };

  const getRoleFieldName = (field: string | { _id: string; firstName?: string; lastName?: string } | null | undefined, roleUsers: User[]): string => {
    if (!field) return '';

    // If field is already a populated object, use its data directly
    if (typeof field === 'object' && field._id && field.firstName && field.lastName) {
      return `${field.firstName} ${field.lastName}`;
    }

    // If field is just an ID string, find the user in roleUsers array
    const fieldId = typeof field === 'object' ? field._id : field;
    const user = roleUsers.find(u => u._id === fieldId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t('users.title')}</h1>

          <CreateUserDialog
            companies={companies}
            projectManagers={projectManagers}
            groupLeaders={groupLeaders}
            responsibleTesters={responsibleTesters}
            onUserCreated={fetchUsers}
          />
        </div>
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.editUser')}</DialogTitle>
              <DialogDescription>
                {t('users.editUserDescription')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('users.firstName')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('users.lastName')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('users.email')} <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('users.phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('users.role')} <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                  disabled={user?.role === 'agentCommercial' && formData.role !== 'client'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Manager field for Group Leader role */}
              {formData.role === 'groupLeader' && (
                <div className="space-y-2">
                  <Label htmlFor="projectManager">{t('users.roles.projectManager')}</Label>
                  <Select
                    value={formData.projectManager || ''}
                    onValueChange={(value) => handleSelectChange('projectManager', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectProjectManager')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('users.noSelection')}</SelectItem>
                      {projectManagers.map(pm => (
                        <SelectItem key={pm._id} value={pm._id}>
                          {pm.firstName} {pm.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(formData.projectManager || selectedUser?.projectManager) && (
                    <p className="text-sm text-gray-600">
                      {t('users.currentSelection')}: {
                        // Use the populated data from selectedUser if available, otherwise find in projectManagers array
                        selectedUser?.projectManager && typeof selectedUser.projectManager === 'object'
                          ? `${selectedUser.projectManager.firstName} ${selectedUser.projectManager.lastName}`
                          : getRoleFieldName(formData.projectManager, projectManagers)
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Group Leader field for Developer role */}
              {formData.role === 'developer' && (
                <div className="space-y-2">
                  <Label htmlFor="groupLeader">{t('users.roles.groupLeader')}</Label>
                  <Select
                    value={formData.groupLeader || ''}
                    onValueChange={(value) => handleSelectChange('groupLeader', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectGroupLeader')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('users.noSelection')}</SelectItem>
                      {groupLeaders.map(gl => (
                        <SelectItem key={gl._id} value={gl._id}>
                          {gl.firstName} {gl.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(formData.groupLeader || selectedUser?.groupLeader) && (
                    <p className="text-sm text-gray-600">
                      {t('users.currentSelection')}: {
                        // Use the populated data from selectedUser if available, otherwise find in groupLeaders array
                        selectedUser?.groupLeader && typeof selectedUser.groupLeader === 'object'
                          ? `${selectedUser.groupLeader.firstName} ${selectedUser.groupLeader.lastName}`
                          : getRoleFieldName(formData.groupLeader, groupLeaders)
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Responsible Tester field for Tester role */}
              {formData.role === 'tester' && (
                <div className="space-y-2">
                  <Label htmlFor="responsibleTester">{t('users.roles.responsibleTester')}</Label>
                  <Select
                    value={formData.responsibleTester || ''}
                    onValueChange={(value) => handleSelectChange('responsibleTester', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectResponsibleTester')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('users.noSelection')}</SelectItem>
                      {responsibleTesters.map(rt => (
                        <SelectItem key={rt._id} value={rt._id}>
                          {rt.firstName} {rt.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(formData.responsibleTester || selectedUser?.responsibleTester) && (
                    <p className="text-sm text-gray-600">
                      {t('users.currentSelection')}: {
                        // Use the populated data from selectedUser if available, otherwise find in responsibleTesters array
                        selectedUser?.responsibleTester && typeof selectedUser.responsibleTester === 'object'
                          ? `${selectedUser.responsibleTester.firstName} ${selectedUser.responsibleTester.lastName}`
                          : getRoleFieldName(formData.responsibleTester, responsibleTesters)
                      }
                    </p>
                  )}
                </div>
              )}

              {formData.role === 'client' && (
                <div className="space-y-2">
                  <Label htmlFor="company">{t('users.company')}</Label>
                  <Select
                    value={formData.company}
                    onValueChange={(value) => handleSelectChange('company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectCompany')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No company">{t('users.noCompany')}</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">{t('users.preferredLanguage')}</Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(value) => handleSelectChange('preferredLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">{t('users.changePassword')}</div>

                <div className="space-y-2 relative">
                  <Label htmlFor="password">{t('users.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('users.confirmNewPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.userDetails')}</DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-semibold">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {formatRole(selectedUser.role)}
                      </span>

                      {selectedUser.isSuspended !== undefined && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.isSuspended)}`}>
                          {selectedUser.isSuspended ? t('users.status.suspended') : t('users.status.active')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.email')}</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.phone')}</Label>
                    <p className="font-medium">{selectedUser.phone || t('users.notProvided')}</p>
                  </div>
                </div>

                {selectedUser.preferredLanguage && (
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.preferredLanguage')}</Label>
                    <p className="font-medium">
                      {selectedUser.preferredLanguage === 'en' && 'English'}
                      {selectedUser.preferredLanguage === 'fr' && 'Français'}
                      {selectedUser.preferredLanguage === 'de' && 'Deutsch'}
                      {selectedUser.preferredLanguage === 'es' && 'Español'}
                      {selectedUser.preferredLanguage === 'ar' && 'العربية'}
                    </p>
                  </div>
                )}

                {selectedUser.company && (
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.company')}</Label>
                    <p className="font-medium">
                      {getCompanyName(selectedUser.company)}
                    </p>
                  </div>
                )}

                {selectedUser.team && (
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.team')}</Label>
                    <p className="font-medium">{selectedUser.team}</p>
                  </div>
                )}

                {selectedUser.createdAt && (
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.memberSince')}</Label>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedUser.createdBy && (
                  <div>
                    <Label className="text-gray-500 text-sm">{t('users.createdBy')}</Label>
                    <p className="font-medium">{selectedUser.createdBy.firstName} {selectedUser.createdBy.lastName}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  {/* Only show the suspend/activate button for admin users */}
                  {user?.role === 'admin' && selectedUser._id !== user.id && (
                    <Button
                      variant={selectedUser.isSuspended ? "outline" : "secondary"}
                      onClick={() => {
                        setUserToSuspend(selectedUser);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      {selectedUser.isSuspended ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('users.activateUser')}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('users.suspendUser')}
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false);
                    setupEditForm(selectedUser);
                  }}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </Button>

                  {/* Only show delete button for admin users */}
                  {user?.role === 'admin' && selectedUser._id !== user.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('users.deleteConfirmation', {
                              name: `${selectedUser.firstName} ${selectedUser.lastName}`
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setUserToDelete(selectedUser);
                              setIsViewDialogOpen(false);
                              handleDeleteUser();
                            }}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={isViewCompanyDialogOpen} onOpenChange={setIsViewCompanyDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t('companies.companyDetails')}</DialogTitle>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('companies.name')}</Label>
                    <p>{selectedCompany.name}</p>
                  </div>
                  <div>
                    <Label>{t('companies.billingMethod.title')}</Label>
                    <p>{t(selectedCompany.billingMethod)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">{t('companies.address')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('companies.street')}</Label>
                      <p>{selectedCompany.address.street}</p>
                    </div>
                    <div>
                      <Label>{t('companies.city')}</Label>
                      <p>{selectedCompany.address.city}</p>
                    </div>
                    <div>
                      <Label>{t('companies.zipCode')}</Label>
                      <p>{selectedCompany.address.zipCode}</p>
                    </div>
                    <div>
                      <Label>{t('companies.country')}</Label>
                      <p>{selectedCompany.address.country}</p>
                    </div>
                    {selectedCompany.address.state && (
                      <div>
                        <Label>{t('companies.state')}</Label>
                        <p>{selectedCompany.address.state}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">{t('companies.contactPerson')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('companies.contactName')}</Label>
                      <p>{selectedCompany.contactPerson.name}</p>
                    </div>
                    <div>
                      <Label>{t('companies.position')}</Label>
                      <p>{selectedCompany.contactPerson.position || '-'}</p>
                    </div>
                    <div>
                      <Label>{t('companies.email')}</Label>
                      <p>{selectedCompany.contactPerson.email}</p>
                    </div>
                    <div>
                      <Label>{t('companies.phone')}</Label>
                      <p>{selectedCompany.contactPerson.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={isEditCompanyDialogOpen} onOpenChange={setIsEditCompanyDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t('companies.editCompany')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label>{t('companies.name')} *</Label>
                <Input
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  required
                />
              </div>

              {/* Address Section */}
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium mb-4">{t('companies.address')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('companies.street')} *</Label>
                    <Input
                      value={companyFormData.address.street}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          address: { ...companyFormData.address, street: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.city')} *</Label>
                    <Input
                      value={companyFormData.address.city}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          address: { ...companyFormData.address, city: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.zipCode')} *</Label>
                    <Input
                      value={companyFormData.address.zipCode}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          address: { ...companyFormData.address, zipCode: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.country')} *</Label>
                    <Input
                      value={companyFormData.address.country}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          address: { ...companyFormData.address, country: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.state')}</Label>
                    <Input
                      value={companyFormData.address.state}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          address: { ...companyFormData.address, state: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium mb-4">{t('companies.primaryContact')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('companies.contactName')} *</Label>
                    <Input
                      value={companyFormData.contactPerson.name}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          contactPerson: { ...companyFormData.contactPerson, name: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.position')}</Label>
                    <Input
                      value={companyFormData.contactPerson.position}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          contactPerson: { ...companyFormData.contactPerson, position: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.email')} *</Label>
                    <Input
                      type="email"
                      value={companyFormData.contactPerson.email}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          contactPerson: { ...companyFormData.contactPerson, email: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companies.phone')} *</Label>
                    <Input
                      value={companyFormData.contactPerson.phone}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          contactPerson: { ...companyFormData.contactPerson, phone: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Billing Method */}
              <div className="space-y-2">
                <Label>{t('companies.billingMethod.title')} *</Label>
                <Select
                  value={companyFormData.billingMethod}
                  onValueChange={(value) =>
                    setCompanyFormData({ ...companyFormData, billingMethod: value as 'hourly' | 'perTask' | 'subscription' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('companies.selectBilling')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">{t('hourly')}</SelectItem>
                    <SelectItem value="perTask">{t('perTask')}</SelectItem>
                    <SelectItem value="subscription">{t('subscription')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Existing Files */}
              {selectedCompany?.documents?.length > 0 && (
                <div className="border p-4 rounded-lg">
                  <h3 className="font-medium mb-4">{t('companies.existingFiles')}</h3>
                  <ul className="space-y-2">
                    {selectedCompany.documents.map((file) => (
                      <li key={file._id} className="flex items-center justify-between">
                        <span>{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveExistingFile(file._id)}
                        >
                          {t('common.remove')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload New Files */}
              <div className="space-y-2">
                <Label>{t('companies.uploadFiles')}</Label>
                <Input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e)}
                />
                <p className="text-sm text-gray-500">
                  {t('companies.fileRequirements', {
                    maxFiles: 5,
                    maxSize: '10 MB',
                  })}
                </p>
                {uploadedFiles.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm text-gray-700">
                        <span>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          {t('common.remove')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('companies.deleteConfirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCompany}
                className="bg-red-500 hover:bg-red-600"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* View Mode Tabs */}
      <Tabs
        defaultValue="workers"
        value={viewMode}
        onValueChange={setViewMode}
        className="mb-6"
      >
        <TabsList>
          {/* Workers tab - Admin only */}
          {user?.role === 'admin' && (
            <TabsTrigger value="workers">
              <Users className="h-4 w-4 mr-2" />
              {t('users.tabs.workers')}
            </TabsTrigger>
          )}

          {/* Clients tab - For both roles */}
          <TabsTrigger value="clients">
            <Building className="h-4 w-4 mr-2" />
            {t('users.tabs.clients')}
          </TabsTrigger>

          {/* New Company tab - Admin & AgentCommercial */}
          {['admin', 'agentCommercial'].includes(user?.role) && (
            <TabsTrigger value="company">
              <Briefcase className="h-4 w-4 mr-2" />
              {t('users.tabs.company')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('companies.title')}</CardTitle>
                <Dialog open={isCreateCompanyDialogOpen} onOpenChange={setIsCreateCompanyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Building className="h-4 w-4 mr-2" />
                      {t('companies.createCompany')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{t('companies.createCompany')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('companies.name')} *</Label>
                        <Input
                          value={companyFormData.name}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="border p-4 rounded-lg">
                        <h3 className="font-medium mb-4">{t('companies.address')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('companies.street')} *</Label>
                            <Input
                              value={companyFormData.address.street}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                address: { ...companyFormData.address, street: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.city')} *</Label>
                            <Input
                              value={companyFormData.address.city}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                address: { ...companyFormData.address, city: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.zipCode')} *</Label>
                            <Input
                              value={companyFormData.address.zipCode}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                address: { ...companyFormData.address, zipCode: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.country')} *</Label>
                            <Input
                              value={companyFormData.address.country}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                address: { ...companyFormData.address, country: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.state')}</Label>
                            <Input
                              value={companyFormData.address.state}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                address: { ...companyFormData.address, state: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border p-4 rounded-lg">
                        <h3 className="font-medium mb-4">{t('companies.primaryContact')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('companies.contactName')} *</Label>
                            <Input
                              value={companyFormData.contactPerson.name}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                contactPerson: { ...companyFormData.contactPerson, name: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.position')}</Label>
                            <Input
                              value={companyFormData.contactPerson.position}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                contactPerson: { ...companyFormData.contactPerson, position: e.target.value }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.email')} *</Label>
                            <Input
                              type="email"
                              value={companyFormData.contactPerson.email}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                contactPerson: { ...companyFormData.contactPerson, email: e.target.value }
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('companies.phone')} *</Label>
                            <Input
                              value={companyFormData.contactPerson.phone}
                              onChange={(e) => setCompanyFormData({
                                ...companyFormData,
                                contactPerson: { ...companyFormData.contactPerson, phone: e.target.value }
                              })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('companies.billingMethod.title')} *</Label>
                        <Select
                          value={companyFormData.billingMethod}
                          onValueChange={(value) => setCompanyFormData({
                            ...companyFormData,
                            billingMethod: value as 'hourly' | 'perTask' | 'subscription'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('companies.selectBilling')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">{t('hourly')}</SelectItem>
                            <SelectItem value="perTask">{t('perTask')}</SelectItem>
                            <SelectItem value="subscription">{t('subscription')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('companies.uploadFiles')}</Label>
                        <Input
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e)}
                        />
                        <p className="text-sm text-gray-500">
                          {t('companies.fileRequirements', {
                            maxFiles: 5,
                            maxSize: '10 MB',
                          })}
                        </p>
                        {uploadedFiles.length > 0 && (
                          <ul className="mt-2 space-y-2">
                            {uploadedFiles.map((file, index) => (
                              <li key={index} className="flex items-center justify-between text-sm text-gray-700">
                                <span>
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-2"
                                  onClick={() => handleRemoveFile(index)}
                                >
                                  {t('common.remove')}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateCompanyDialogOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                          {t('common.create')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div><br />
              <div className="flex gap-2">
                <Input
                  placeholder={t('companies.search')}
                  value={companyFilters.searchTerm}
                  onChange={(e) => setCompanyFilters(prev => ({
                    ...prev,
                    searchTerm: e.target.value
                  }))}
                />
                <Select
                  value={companyFilters.billingMethod}
                  onValueChange={(value) => setCompanyFilters(prev => ({
                    ...prev,
                    billingMethod: value
                  }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('companies.billingMethod.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="hourly">{t('hourly')}</SelectItem>
                    <SelectItem value="perTask">{t('perTask')}</SelectItem>
                    <SelectItem value="subscription">{t('subscription')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('address')}</TableHead>
                    <TableHead>{t('contactPerson')}</TableHead>
                    <TableHead>{t('billingMethod')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company._id}>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>
                        {`${company.address.street}, ${company.address.zipCode} ${company.address.city}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{company.contactPerson.name}</span>
                          <span className="text-sm text-gray-500">
                            {company.contactPerson.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(company.billingMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(company.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCompany(company);
                              setIsViewCompanyDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setupEditCompany(company)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setCompanyToDelete(company)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filters */}
      {viewMode !== 'company' && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{t('common.filters')}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchUsers}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  {t('common.resetFilters')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-blue-50' : ''}
                >
                  <Filter className={`h-4 w-4 ${showFilters ? 'text-blue-600' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                className="pl-9"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Select
                    value={filters.role}
                    onValueChange={(value) => handleFilterChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.filterByRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                      {viewMode === 'workers' ? (
                        <>
                          <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                          <SelectItem value="responsibleClient">{t('users.roles.responsibleClient')}</SelectItem>
                          <SelectItem value="agentCommercial">{t('users.roles.agentCommercial')}</SelectItem>
                          {/* <SelectItem value="commercial">{t('users.roles.commercial')}</SelectItem> */}
                          <SelectItem value="projectManager">{t('users.roles.projectManager')}</SelectItem>
                          <SelectItem value="groupLeader">{t('users.roles.groupLeader')}</SelectItem>
                          <SelectItem value="developer">{t('users.roles.developer')}</SelectItem>
                          <SelectItem value="responsibleTester">{t('users.roles.responsibleTester')}</SelectItem>
                          <SelectItem value="tester">{t('users.roles.tester')}</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="client">{t('users.roles.client')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {viewMode === 'clients' && (
                  <div>
                    <Select
                      value={filters.company}
                      onValueChange={(value) => handleFilterChange('company', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('users.filterByCompany')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('users.allCompanies')}</SelectItem>
                        {companies.map(company => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
                      <SelectItem value="active">{t('users.status.active')}</SelectItem>
                      <SelectItem value="suspended">{t('users.status.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>)}

      {/* User Suspension Dialog */}
      <AlertDialog
        open={!!userToSuspend}
        onOpenChange={(isOpen) => !isOpen && setUserToSuspend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToSuspend?.isSuspended
                ? t('users.activateConfirmation', { name: `${userToSuspend?.firstName} ${userToSuspend?.lastName}` })
                : t('users.suspendConfirmation', { name: `${userToSuspend?.firstName} ${userToSuspend?.lastName}` })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleSuspension}
              disabled={isProcessing}
              className={userToSuspend?.isSuspended
                ? "bg-green-500 hover:bg-green-600"
                : "bg-yellow-500 hover:bg-yellow-600"}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : userToSuspend?.isSuspended ? (
                t('users.activateUser')
              ) : (
                t('users.suspendUser')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Deletion Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteConfirmation', {
                name: `${userToDelete?.firstName} ${userToDelete?.lastName}`
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User List */}
      {viewMode !== 'company' && (
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">{t('users.views.table')}</TabsTrigger>
            <TabsTrigger value="grid">{t('users.views.grid')}</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('users.title')}</CardTitle>
                <CardDescription>
                  {viewMode === 'workers'
                    ? t('users.manageWorkers')
                    : t('users.manageClients')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('users.name')}</TableHead>
                        <TableHead>{t('users.email')}</TableHead>
                        <TableHead>{t('users.role')}</TableHead>
                        {viewMode === 'clients' && (
                          <TableHead>{t('users.company')}</TableHead>
                        )}
                        <TableHead>{t('users.status.title')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {formatRole(user.role)}
                            </span>
                          </TableCell>
                          {viewMode === 'clients' && (
                            <TableCell>
                              {getCompanyName(user.company)}
                            </TableCell>
                          )}
                          <TableCell>
                            {user.isSuspended !== undefined && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isSuspended)}`}>
                                {user.isSuspended ? t('users.status.suspended') : t('users.status.active')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setupViewUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setupEditForm(user)}
                              >
                                <PencilLine className="h-4 w-4" />
                              </Button>

                              {user.role !== 'admin' && user._id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50"
                                  onClick={() => setUserToSuspend(user)}
                                >
                                  {user.isSuspended ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

                              {user.role !== 'admin' && user._id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setUserToDelete(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <p className="text-gray-500 mb-4">{t('users.noUsersFound')}</p>
                    {(filters.searchTerm || filters.role !== 'all' || filters.company !== 'all' || filters.status !== 'all') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                      >
                        {t('common.clearAllFilters')}
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <Card key={user._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <CardTitle className="text-base">
                            {user.firstName} {user.lastName}
                          </CardTitle>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 w-20">{t('users.email')}:</span>
                          <span className="font-medium truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-20">{t('users.phone')}:</span>
                          <span>{user.phone || t('users.notProvided')}</span>
                        </div>
                        {viewMode === 'clients' && user.company && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-20">{t('users.company')}:</span>
                            <span>{getCompanyName(user.company)}</span>
                          </div>
                        )}
                        {user.isSuspended !== undefined && (
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isSuspended)}`}>
                              {user.isSuspended ? t('users.status.suspended') : t('users.status.active')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setupViewUser(user)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t('common.view')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setupEditForm(user)}>
                        <PencilLine className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>

                      {user.role !== 'admin' && user._id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={user.isSuspended ? "text-green-500" : "text-yellow-500"}
                          onClick={() => setUserToSuspend(user)}
                        >
                          {user.isSuspended ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('users.activate')}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('users.suspend')}
                            </>
                          )}
                        </Button>
                      )}

                      {user.role !== 'admin' && user._id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                  <p className="text-gray-500 mb-4">{t('users.noUsersFound')}</p>
                  {(filters.searchTerm || filters.role !== 'all' || filters.company !== 'all' || filters.status !== 'all') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                    >
                      {t('common.clearAllFilters')}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}