import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { UserService } from '../api/UserService';
import { Loader2, User, Lock } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await UserService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        toast({
          title: t('common.error'),
          description: t('user.fetchError'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast, t]);

  const isRTL = i18n.language === 'ar';

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  
    if (!passwordData.oldPassword) {
      errors.oldPassword = t('auth.currentPasswordRequired');
    }
  
    if (!passwordData.newPassword) {
      errors.newPassword = t('auth.newPasswordRequired');
    } else if (!passwordRegex.test(passwordData.newPassword)) {
      errors.newPassword = t('auth.passwordRequirements');
    }
  
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDontMatch');
    }
  
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    
    try {
      await UserService.changePassword(
        user._id,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }
      );

      toast({
        title: t('auth.passwordChanged'),
        description: t('auth.passwordUpdateSuccess'),
      });

      setShowPasswordDialog(false);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      let errorMessage = t('auth.passwordChangeError');
      
      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'Invalid current password':
            errorMessage = t('auth.invalidCurrentPassword');
            break;
          case 'User not found':
            errorMessage = t('auth.userNotFound');
            break;
        }
      }

      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-2xl font-bold text-primary mb-6 ${isRTL ? 'text-right w-full' : ''}`}>
          {t('auth.profile')}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Side - Profile Icon */}
          <div className={`md:col-span-1 ${isRTL ? 'md:order-last' : ''}`}>
            <Card className="overflow-hidden h-[500px]">
              <div className="h-48 bg-gradient-to-b from-primary/20 to-background" />
              <div className="px-6 -mt-16 relative pb-6">
                <div className="w-32 h-32 rounded-full bg-white p-2 mx-auto mb-4 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <Badge variant="outline" className="mt-2">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - User Information */}
          <div className={`md:col-span-2 ${isRTL ? 'md:order-first' : ''}`}>
            <Card className="h-[500px] overflow-auto">
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'users.firstName', value: user.firstName },
                    { label: 'users.lastName', value: user.lastName },
                    { label: 'auth.email', value: user.email },
                    { label: 'users.phone', value: user.phone },
                    { label: 'users.role', value: t(`users.roles.${user.role}`) },
                    { label: 'users.preferredLanguage', value: user.preferredLanguage },
                    { label: 'users.memberSince', value: formatDate(user.createdAt) },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm text-gray-500">{t(item.label)}</p>
                      <p className="text-lg font-medium">{item.value}</p>
                    </div>
                  ))}
                  
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      <Lock className="h-4 w-4" />
                      {t('auth.changePassword')}
                    </Button>
                  </div>
                </div>

                {user.notifications?.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t('notifications.title')}</h3>
                    <div className="space-y-4">
                      {user.notifications.map((notification) => (
                        <div 
                          key={notification._id.$oid}
                          className={`p-4 rounded-lg border ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-100'} ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.changePassword')}</DialogTitle>
            <DialogDescription>
              {t('auth.passwordUpdateDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {[
              {
                id: 'current-password',
                label: 'auth.currentPassword',
                field: 'oldPassword',
                placeholder: 'auth.enterCurrentPassword'
              },
              {
                id: 'new-password',
                label: 'auth.newPassword',
                field: 'newPassword',
                placeholder: 'auth.enterNewPassword'
              },
              {
                id: 'confirm-password',
                label: 'auth.confirmPassword',
                field: 'confirmPassword',
                placeholder: 'auth.confirmNewPassword'
              }
            ].map(({ id, label, field, placeholder }) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id}>{t(label)}</Label>
                <Input
                  id={id}
                  type="password"
                  value={passwordData[field]}
                  onChange={(e) => handlePasswordChange(field, e.target.value)}
                  placeholder={t(placeholder)}
                />
                {passwordErrors[field] && (
                  <p className="text-sm text-red-500">{passwordErrors[field]}</p>
                )}
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t('common.saving')}
                </>
              ) : (
                t('common.updatePassword')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}