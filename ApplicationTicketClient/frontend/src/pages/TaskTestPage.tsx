import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Search,Eye } from 'lucide-react';
import api from '@/api/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';


interface Task {
  _id: string;
  number: string;
  name: string;
  status: 'ToDo' | 'Blocked' | 'Declined' | 'Testing' | 'TestPassed' | 'TestFailed' | 'Expired' | 'Overdue';
  assignedTo: Array<{ _id: string; firstName: string; lastName: string }>;
  dueDate: string;
  createdAt: string;
  testCases?: Array<{
    name: string;
    status: 'NotTested' | 'Passed' | 'Failed';
    executedBy?: { _id: string; firstName: string };
    executedAt?: string;
  }>;
  blockers?: Array<{
    reason: string;
    createdBy: { _id: string; firstName: string; lastName: string };
    createdAt: string;
    resolved: boolean;
  }>;
}

export default function TaskTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === 'ar';
  useEffect(() => {
    const fetchTestingTasks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/v1/testing/testing-tasks');
        setTasks(response.data);
      } catch (error) {
        console.error(t('testTask.errors.fetchError'), error);
        if (error.response?.status === 403) {
          navigate('/unauthorized');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTestingTasks();
  }, [navigate]);

  useEffect(() => {
    const filtered = tasks.filter(task =>
      task.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      ToDo: 'bg-yellow-100 text-yellow-800',
      Blocked: 'bg-red-50 text-red-700',
      Declined: 'bg-pink-100 text-pink-800',
      Testing: 'bg-purple-100 text-purple-800',
      TestFailed: 'bg-red-100 text-red-800',
      TestPassed: 'bg-green-100 text-green-800',
      Expired: 'bg-orange-100 text-orange-800',
      Overdue: 'bg-amber-100 text-amber-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateTestProgress = (testCases: Task['testCases'] = []) => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    return total > 0
      ? t('testTask.progress.passedSummary', { 
          passed, 
          total, 
          percent: Math.round((passed / total) * 100) 
        })
      : t('testTask.progress.noCases');
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const allTasks = filteredTasks.filter(t => t.status !== 'Blocked');
  const blockedTasks = filteredTasks.filter(t => t.status === 'Blocked');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t('testTask.title')}</h1>
          {['responsibleTester', 'admin'].includes(user?.role) && (
            <Button onClick={() => navigate('/task-test/create')}>
              {t('testTask.actions.createTask')}
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <CardTitle className="text-lg">{t('testTask.dashboardTitle')}</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t('testTask.search.placeholder')}
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  {t('testTask.tabs.allTasks', { count: allTasks.length })}
                </TabsTrigger>
                <TabsTrigger value="blocked">
                  {t('testTask.tabs.blockedTasks', { count: blockedTasks.length })}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('testTask.tableHeaders.id')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.name')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.assignedTo')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.dueDate')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.progress')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.status')}</TableHead>
                      <TableHead>{t('tasks.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                          <span className="sr-only">{t('testTask.loading')}</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allTasks.map(task => (
                        <TableRow key={task._id} className="hover:bg-gray-50">
                          <TableCell>{task.number}</TableCell>
                          <TableCell>{task.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {task.assignedTo.map(u => (
                                <Badge 
                                  key={u._id} 
                                  variant="outline" 
                                  className="bg-blue-50 text-blue-700"
                                >
                                  {u.firstName} {u.lastName}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(task.dueDate)}</TableCell>
                          <TableCell>{calculateTestProgress(task.testCases)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(task.status)}>
                              {t(`testTask.status.${task.status.toLowerCase()}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const path = `/test-tasks/${task._id}` 
                              navigate(path);
                            }}
                          >
                            <Eye className={`h-4 w-4 ${rtl ? 'ml-1' : 'mr-1'}`} />
                            {t('tasks.view')}
                          </Button>
                        </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="blocked">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('testTask.tableHeaders.id')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.name')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.blockers')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.blockedOn')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.assignedTo')}</TableHead>
                      <TableHead>{t('testTask.tableHeaders.status')}</TableHead>
                      <TableHead>{t('tasks.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                          <span className="sr-only">{t('testTask.loading')}</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedTasks.map(task => {
                        const firstBlocker = task.blockers?.[0];
                        return (
                          <TableRow key={task._id} className="hover:bg-gray-50">
                            <TableCell>{task.number}</TableCell>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>
                              {task.blockers?.length ?? 0}
                            </TableCell>
                            <TableCell>
                              {firstBlocker ? formatDate(firstBlocker.createdAt) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {task.assignedTo.map(u => (
                                  <Badge 
                                    key={u._id} 
                                    variant="outline" 
                                    className="bg-blue-50 text-blue-700"
                                  >
                                    {u.firstName} {u.lastName}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(task.status)}>
                                {t(`testTask.status.${task.status.toLowerCase()}`)}
                              </Badge>
                            </TableCell>
                              <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                const path = `/test-tasks/${task._id}` 
                                navigate(path);
                              }}
                            >
                              <Eye className={`h-4 w-4 ${rtl ? 'ml-1' : 'mr-1'}`} />
                              {t('tasks.view')}
                            </Button>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}