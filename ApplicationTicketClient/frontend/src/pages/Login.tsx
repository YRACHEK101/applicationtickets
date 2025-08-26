import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2, Building, Briefcase, Eye, EyeOff } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

export default function Login() {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingLogin, setPendingLogin] = useState(false);
  const [pendingWorkerLogin, setPendingWorkerLogin] = useState(false);


  // State for both worker and client login forms
  const [workerCredentials, setWorkerCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [clientCredentials, setClientCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Loading states
  const [isWorkerLoading, setIsWorkerLoading] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  
  // Password visibility states
  const [showWorkerPassword, setShowWorkerPassword] = useState(false);
  const [showClientPassword, setShowClientPassword] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('worker');

  const handleWorkerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkerCredentials({
      ...workerCredentials,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleClientChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClientCredentials({
      ...clientCredentials,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  useEffect(() => {
    if (pendingWorkerLogin && user) {
      if (user.role == 'client') {
        toast({
          title: t('common.error'),
          description: t('auth.clientCannotLoginAsWorker'),
          variant: 'destructive',
        });
        setIsWorkerLoading(false);
      } else {
        navigate('/');
      }
      setPendingWorkerLogin(false);
    }
  }, [pendingWorkerLogin, user]);

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    setIsWorkerLoading(true);

    try {
      await login(workerCredentials.email, workerCredentials.password);
      setPendingWorkerLogin(true);
    } catch (error) {
      let errorMessage = t('auth.invalidCredentials');
      
      // Check for specific error types
      if (error.response?.status === 403) {
        errorMessage = t('auth.accountSuspended');
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsWorkerLoading(false);
    }
  };

  useEffect(() => {
  if (pendingLogin && user) {
    if (user.role !== 'client') {
      toast({
        title: t('common.error'),
        description: t('auth.WorkerCannotLoginAsClient'),
        variant: 'destructive',
      });
      setIsClientLoading(false);
    } else {
      navigate('/');
    }
    setPendingLogin(false);
  }
}, [pendingLogin, user]);

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setIsClientLoading(true);
    await login(clientCredentials.email, clientCredentials.password);
    setPendingLogin(true);

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 md:p-8">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{t('auth.welcome')}</h1>
          <p className="text-gray-600 mt-2">{t('auth.loginToAccess')}</p>
        </div>
        
        <Tabs 
          defaultValue="worker" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="worker" className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              {t('auth.workerLogin')}
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              {t('auth.clientLogin')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="worker">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.workerLogin')}</CardTitle>
                <CardDescription>{t('auth.workerLoginDesc')}</CardDescription>
              </CardHeader>
              <form onSubmit={handleWorkerSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workerEmail">{t('auth.email')}</Label>
                    <Input
                      id="workerEmail"
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      value={workerCredentials.email}
                      onChange={handleWorkerChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="workerPassword">{t('auth.password')}</Label>
                      <a 
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        href="#forgot-password"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle forgot password
                          toast({
                            title: t('auth.passwordReset'),
                            description: t('auth.contactAdmin'),
                          });
                        }}
                      >
                        {t('auth.forgotPassword')}
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="workerPassword"
                        name="password"
                        type={showWorkerPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={workerCredentials.password}
                        onChange={handleWorkerChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowWorkerPassword(!showWorkerPassword)}
                      >
                        {showWorkerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="workerRememberMe"
                      name="rememberMe"
                      checked={workerCredentials.rememberMe}
                      onCheckedChange={(checked) => setWorkerCredentials({
                        ...workerCredentials,
                        rememberMe: checked === true
                      })}
                    />
                    <Label 
                      htmlFor="workerRememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isWorkerLoading}>
                    {isWorkerLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.loggingIn')}
                      </>
                    ) : (
                      t('auth.signIn')
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="client">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.clientLogin')}</CardTitle>
                <CardDescription>{t('auth.clientLoginDesc')}</CardDescription>
              </CardHeader>
              <form onSubmit={handleClientSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">{t('auth.email')}</Label>
                    <Input
                      id="clientEmail"
                      name="email"
                      type="email"
                      placeholder="name@yourcompany.com"
                      value={clientCredentials.email}
                      onChange={handleClientChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clientPassword">{t('auth.password')}</Label>
                      <a 
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        href="#forgot-password"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle forgot password
                          toast({
                            title: t('auth.passwordReset'),
                            description: t('auth.contactCommercial'),
                          });
                        }}
                      >
                        {t('auth.forgotPassword')}
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="clientPassword"
                        name="password"
                        type={showClientPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={clientCredentials.password}
                        onChange={handleClientChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowClientPassword(!showClientPassword)}
                      >
                        {showClientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="clientRememberMe"
                      name="rememberMe"
                      checked={clientCredentials.rememberMe}
                      onCheckedChange={(checked) => setClientCredentials({
                        ...clientCredentials,
                        rememberMe: checked === true
                      })}
                    />
                    <Label 
                      htmlFor="clientRememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isClientLoading}>
                    {isClientLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.loggingIn')}
                      </>
                    ) : (
                      t('auth.signIn')
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.needHelp')}
          <a 
            href="mailto:support@liadtech.com" 
            className="font-medium text-blue-600 hover:text-blue-500 ml-1"
          >
            support@liadtech.com
          </a>
        </p>
      </div>
    </div>
  );
}