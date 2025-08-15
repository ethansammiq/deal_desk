import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users, 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface DepartmentQueueProps {
  department?: string;
}

interface WorkloadMetrics {
  totalPending: number;
  overdueTasks: number;
  avgProcessingTime: number;
  completedToday: number;
  departmentCapacity: number;
  currentLoad: number;
}

interface QueueItem {
  id: number;
  dealId: number;
  dealName: string;
  clientName: string;
  priority: 'normal' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  assignedTo?: number;
  assignedToName?: string;
  dealValue: number;
  stage: number;
  isOverdue: boolean;
  daysSinceCreated: number;
}

export function DepartmentQueueDashboard({ department }: DepartmentQueueProps) {
  const { data: user } = useCurrentUser();
  const [selectedDepartment, setSelectedDepartment] = useState(department || user?.department || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000
  });

  // Fetch queue data for selected department
  const { data: queueData, isLoading } = useQuery<{
    items: QueueItem[];
    metrics: WorkloadMetrics;
  }>({
    queryKey: [`/api/department-queue/${selectedDepartment}`],
    staleTime: 30000
  });

  // Fetch workload distribution data
  const { data: workloadDistribution = [] } = useQuery<{
    department: string;
    displayName: string;
    pendingCount: number;
    overdueCount: number;
    avgProcessingTime: number;
    loadPercentage: number;
  }[]>({
    queryKey: ['/api/department-workload-distribution'],
    staleTime: 60000
  });

  const filteredItems = queueData?.items?.filter(item => {
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      item.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  }) || [];

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { urgent: 3, high: 2, normal: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'dealValue':
        return b.dealValue - a.dealValue;
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLoadColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Queue Dashboard</h1>
          <p className="text-gray-600">Manage approval workloads across departments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.department} value={dept.department}>
                  {dept.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData?.metrics?.totalPending || 0}</div>
            <p className="text-sm text-gray-600">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{queueData?.metrics?.overdueTasks || 0}</div>
            <p className="text-sm text-gray-600">Past deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData?.metrics?.avgProcessingTime || 0}h</div>
            <p className="text-sm text-gray-600">Per approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{queueData?.metrics?.completedToday || 0}</div>
            <p className="text-sm text-gray-600">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workload Distribution
          </CardTitle>
          <CardDescription>Current load across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workloadDistribution.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.displayName}</span>
                  <Badge variant="outline" className="text-xs">
                    {dept.pendingCount} pending
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Load: {dept.loadPercentage}%</span>
                    <span className="text-gray-500">{dept.avgProcessingTime}h avg</span>
                  </div>
                  <Progress 
                    value={dept.loadPercentage} 
                    className="h-2"
                  />
                  {dept.overdueCount > 0 && (
                    <div className="text-xs text-red-600">
                      {dept.overdueCount} overdue tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>
                {selectedDepartment === 'all' ? 'All departments' : departments.find(d => d.department === selectedDepartment)?.displayName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dealValue">Deal Value</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queue Items */}
          <div className="space-y-3">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items found matching your criteria
              </div>
            ) : (
              sortedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg p-4 ${item.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{item.dealName}</h4>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        {item.isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {item.clientName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}
                        </div>
                        <div>
                          Deal Value: ${item.dealValue.toLocaleString()}
                        </div>
                        {item.assignedToName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.assignedToName}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`/deals/${item.dealId}`, '_blank')}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}