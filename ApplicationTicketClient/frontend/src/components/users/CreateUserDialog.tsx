import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/use-toast';
import api from '../../api/api';

// UI Components
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// Icons
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';

// Types
interface Company {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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

interface CreateUserDialogProps {
  companies: Company[];
  projectManagers: User[];
  groupLeaders: User[];
  responsibleTesters: User[];
  onUserCreated: () => void;
}

export default function CreateUserDialog({ 
  companies, 
  projectManagers,
  groupLeaders,
  responsibleTesters,
  onUserCreated 
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return; 
    }
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
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

  // Handle user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email ||
      !formData.role || !formData.password) {
      toast({
        title: t('common.error'),
        description: t('users.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('users.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    // Check if commercial is trying to create non-client user
    if (user?.role === 'agentCommercial' && formData.role !== 'client') {
      toast({
        title: t('common.error'),
        description: t('users.commercialCanOnlyCreateClients'),
        variant: 'destructive',
      });
      return;
    }

    // Validate role-specific required fields
    if (formData.role === 'groupLeader' && !formData.projectManager) {
      toast({
        title: t('common.error'),
        description: t('users.projectManagerRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.role === 'developer' && !formData.groupLeader) {
      toast({
        title: t('common.error'),
        description: t('users.groupLeaderRequired'),
        variant: 'destructive',
      });
      return;
    }
    if (formData.role === 'tester' && !formData.responsibleTester) {
      toast({
        title: t('common.error'),
        description: t('users.responsibleTesterRequired'),
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

    try {
      // Use the auth/register endpoint which has the proper permission checks
      await api.post('/v1/auth/register', formData);

      toast({
        title: t('common.success'),
        description: t('users.createSuccess'),
      });

      // Reset form and close dialog
      resetFormData();
      setIsOpen(false);

      // Notify parent component
      onUserCreated();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('users.createError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => resetFormData()}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('users.createUser')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.createUser')}</DialogTitle>
          <DialogDescription>
            {t('users.createUserDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-4 py-4">
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

          {/* Project Manager Selection for Group Leaders */}
          {formData.role === 'groupLeader' && (
            <div className="space-y-2">
              <Label htmlFor="projectManager">{t('users.roles.projectManager')} <span className="text-red-500">*</span></Label>
              <Select
                value={formData.projectManager}
                onValueChange={(value) => handleSelectChange('projectManager', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectProjectManager')} />
                </SelectTrigger>
                <SelectContent>
                  {projectManagers.map(pm => (
                    <SelectItem key={pm._id} value={pm._id}>
                      {pm.firstName} {pm.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group Leader Selection for Developers */}
          {formData.role === 'developer' && (
            <div className="space-y-2">
              <Label htmlFor="groupLeader">{t('users.roles.groupLeader')} <span className="text-red-500">*</span></Label>
              <Select
                value={formData.groupLeader}
                onValueChange={(value) => handleSelectChange('groupLeader', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectGroupLeader')} />
                </SelectTrigger>
                <SelectContent>
                  {groupLeaders.map(gl => (
                    <SelectItem key={gl._id} value={gl._id}>
                      {gl.firstName} {gl.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.role === 'tester' && (
            <div className="space-y-2">
              <Label htmlFor="responsibleTester">{t('users.selectResponsibleTester')}</Label>
              <Select
                value={formData.responsibleTester || ''}
                onValueChange={(value) => handleSelectChange('responsibleTester', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectResponsibleTester')} />
                </SelectTrigger>
                <SelectContent>
                  {responsibleTesters.map((rt) => (
                    <SelectItem key={rt._id} value={rt._id}>
                      {rt.firstName} {rt.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('users.password')} <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('users.confirmPassword')} <span className="text-red-500">*</span></Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}