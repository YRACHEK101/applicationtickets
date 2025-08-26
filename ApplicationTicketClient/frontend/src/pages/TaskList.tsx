// src/pages/TaskList.tsx
import { useState, useEffect } from 'react';
import { useNavigate , useSearchParams  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Loader2, 
  Search, 
  Filter, 
  Plus, 
  Eye,
  AlertCircle,
  Clock,
  MessageCircle,
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import api from '../api/api';

// Task interface
interface Task {
  _id: string;
  number: string;
  name: string;
  description: string;
  ticket?: {
    _id: string;
    number: string;
    title: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  urgency: string;
  priority: number;
  status: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

// Filter state interface
interface TaskFilters {
  status: string;
  urgency: string;
  searchTerm: string;
}

export default function TaskList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams(); // Get query parameters

  
  // Check if RTL is needed
  const rtl = i18n.language === 'ar';
  
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    urgency: 'all',
    searchTerm: '',
  });
  
  // State for view options
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    if (tasks.length > 0) {
      let filtered = [...tasks];
      
      // Filter by search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(task => 
          task.name.toLowerCase().includes(term) ||
          task.number.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term)
        );
      }
      
      // Filter by status
      if (filters.status !== 'all') {
        filtered = filtered.filter(task => task.status === filters.status);
      }
      
      // Filter by urgency
      if (filters.urgency !== 'all') {
        filtered = filtered.filter(task => task.urgency === filters.urgency);
      }
      
      setFilteredTasks(filtered);
    }
  }, [filters, tasks]);

   useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilters(prev => ({ ...prev, status }));
    }
  }, [searchParams]);

  // Fetch tasks from the API
  const fetchTasks = async () => {
    setLoading(true);
    
    try {
      let response;
      if(user?.role==='tester'){
         response = await api.get(`/v1/testing`);
      }
      else{
         response = await api.get(`/v1/task`);
      }

      setTasks(response.data);
      setFilteredTasks(response.data);
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

  // Update a filter value
  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      urgency: 'all',
      searchTerm: '',
    });
  };

  // Get CSS class for task status badge
  const getStatusBadgeClass = (status: string) => {
    const statusClasses = {
      'ToDo': 'bg-gray-200 text-gray-800',
      'InProgress': 'bg-blue-100 text-blue-800',
      'Blocked': 'bg-red-100 text-red-800',
      'Declined': 'bg-amber-100 text-amber-800',
      'Testing': 'bg-purple-100 text-purple-800',
      'TestFailed': 'bg-red-100 text-red-800',
      'TestPassed': 'bg-green-100 text-green-800',
      'Done': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800',
      'Overdue': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  // Get displayed status label
  const getStatusLabel = (status: string) => {
    return t(`tasks.status.${status}`);
  };

  // Get icon for task urgency
  const getUrgencyIcon = (urgency: string) => {
    const urgencyIcons = {
      'Critical': <AlertCircle className="h-4 w-4 text-red-500" />,
      'High': <ArrowUpCircle className="h-4 w-4 text-orange-500" />,
      'Medium': <Clock className="h-4 w-4 text-yellow-500" />,
      'Low': <MessageCircle className="h-4 w-4 text-blue-500" />
    };
    return urgencyIcons[urgency] || <MessageCircle className="h-4 w-4 text-gray-500" />;
  };

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    return t(`tasks.priorityLevels.${
      priority === 5 ? 'highest' :
      priority === 4 ? 'high' :
      priority === 3 ? 'medium' :
      priority === 2 ? 'low' : 'lowest'
    }`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900">{t('tasks.title')}</h1>
          
          {['admin', 'projectManager','groupLeader'].includes(user?.role) && (
            <Button onClick={() => navigate('/tasks/create')}>
              <Plus className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
              {t('tasks.createTask')}
            </Button>
          )}
        </div>
        
        <div className={`flex flex-col md:flex-row items-center justify-between mb-6 gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 w-full md:w-auto ${rtl ? 'flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${rtl ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-gray-500`} />
              <Input
                placeholder={t('tasks.searchPlaceholder')}
                className={`${rtl ? 'pr-9' : 'pl-9'}`}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50' : ''}
            >
              <Filter className={`h-4 w-4 ${showFilters ? 'text-blue-600' : ''}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchTasks}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('tasks.filters')}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                >
                  {t('tasks.clearFilters')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tasks.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tasks.allStatuses')}</SelectItem>
                      <SelectItem value="ToDo">{t('tasks.status.ToDo')}</SelectItem>
                      <SelectItem value="InProgress">{t('tasks.status.InProgress')}</SelectItem>
                      <SelectItem value="Blocked">{t('tasks.status.Blocked')}</SelectItem>
                      <SelectItem value="Declined">{t('tasks.status.Declined')}</SelectItem>
                      <SelectItem value="Testing">{t('tasks.status.Testing')}</SelectItem>
                      <SelectItem value="TestFailed">{t('tasks.status.TestFailed')}</SelectItem>
                      <SelectItem value="TestPassed">{t('tasks.status.TestPassed')}</SelectItem>
                      <SelectItem value="Done">{t('tasks.status.Done')}</SelectItem>
                      <SelectItem value="Expired">{t('tasks.status.Expired')}</SelectItem>
                      <SelectItem value="Overdue">{t('tasks.status.Overdue')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select 
                    value={filters.urgency} 
                    onValueChange={(value) => handleFilterChange('urgency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tasks.filterByUrgency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tasks.allUrgencyLevels')}</SelectItem>
                      <SelectItem value="Critical">{t('tasks.urgencyLevels.critical')}</SelectItem>
                      <SelectItem value="High">{t('tasks.urgencyLevels.high')}</SelectItem>
                      <SelectItem value="Medium">{t('tasks.urgencyLevels.medium')}</SelectItem>
                      <SelectItem value="Low">{t('tasks.urgencyLevels.low')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('tasks.taskList')}</CardTitle>
            <CardDescription>
              {t('tasks.tasksFound', { count: filteredTasks.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTasks.length > 0 ? (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tasks.number')}</TableHead>
                  <TableHead>{t('tasks.name')}</TableHead>
                  <TableHead>{t('tasks.status.title')}</TableHead>
                  <TableHead>{t('tasks.assignedTo')}</TableHead>
                  <TableHead>{t('tasks.priority')}</TableHead>
                  <TableHead>{t('tasks.dueDate')}</TableHead>
                  {/* Afficher la colonne "Créée par" seulement pour admin, projectManager, groupLeader, developer */}
                  {(user.role === 'admin' || user.role === 'projectManager' || user.role === 'groupLeader' || user.role === 'developer') && (
                    <TableHead>{t('tasks.createdBy')}</TableHead>
                  )}
                  <TableHead>{t('tasks.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getUrgencyIcon(task.urgency)}
                        {task.number}
                      </div>
                    </TableCell>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
                        ? (
                          <div className="flex flex-wrap gap-1">
                            {task.assignedTo.map(user => (
                              <Badge key={user._id} variant="outline" className="bg-blue-50 text-blue-700">
                                {`${user.firstName} ${user.lastName}`}
                              </Badge>
                            ))}
                          </div>
                        )
                        : task.assignedTo 
                          ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                            </Badge>
                          )
                          : <span className="text-gray-500">{t('tasks.unassigned')}</span>}
                    </TableCell>
                    <TableCell>{getPriorityLabel(task.priority)}</TableCell>
                    <TableCell>
                      {task.dueDate 
                        ? new Date(task.dueDate).toLocaleDateString(i18n.language)
                        : t('tasks.noDeadline')}
                    </TableCell>
                    {/* Afficher le nom du créateur pour les rôles concernés */}
                    {(user.role === 'admin' || user.role === 'projectManager' || user.role === 'groupLeader' || user.role === 'developer') && (
                      <TableCell>
                        {task.createdBy
                          ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                          : ''}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const path = user?.role === 'tester' 
                            ? `/test-tasks/${task._id}` 
                            : `/tasks/${task._id}`;
                          navigate(path);
                        }}
                      >
                        <Eye className={`h-4 w-4 ${rtl ? 'ml-1' : 'mr-1'}`} />
                        {t('tasks.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-gray-500 mb-4">{t('tasks.noTasksFound')}</p>
                {filters.searchTerm || filters.status !== 'all' || filters.urgency !== 'all' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetFilters}
                  >
                    {t('tasks.clearAllFilters')}
                  </Button>
                ) : ['admin', 'projectManager'].includes(user?.role) ? (
                  <Button 
                    onClick={() => navigate('/tasks/create')}
                  >
                    {t('tasks.createFirstTask')}
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}