import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';

interface ApprovalQueueItem {
  id: number;
  type: string;
  title: string;
  description: string;
  dealId: number;
  dealName: string;
  clientName: string;
  priority: 'normal' | 'high' | 'urgent';
  dueDate: string;
  dealValue: number;
  status: string;
  actionRequired: string;
  stage?: string;
  department?: string;
  reviewType?: string;
  isOverdue: boolean;
}

interface QueueMetrics {
  totalPending: number;
  urgentTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
  avgDealValue: number;
  completedToday: number;
  currentLoad: number;
}

interface ApprovalQueueData {
  items: ApprovalQueueItem[];
  queueType: string;
  summary: string;
  metrics: QueueMetrics;
  userContext: {
    role: string;
    department?: string;
    timestamp: string;
  };
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'high':
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'orange';
    default:
      return 'secondary';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getActionButtonText = (actionRequired: string) => {
  switch (actionRequired) {
    case 'address_revision':
      return 'Address Revision';
    case 'complete_submission':
      return 'Complete Submission';
    case 'business_approval':
      return 'Review & Approve';
    case 'department_review':
      return 'Review';
    case 'system_review':
      return 'Inspect';
    default:
      return 'View Details';
  }
};

export function UniversalApprovalQueue() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const { data: queueData, isLoading, error } = useQuery<ApprovalQueueData>({
    queryKey: ['/api/approvals/pending', currentUser?.role, currentUser?.department],
    enabled: !!currentUser,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (userLoading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Loading Queue...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-r-primary"></div>
            <span className="text-sm text-muted-foreground">Loading your approval queue...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !queueData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Queue Unavailable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load your approval queue. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { items, metrics, summary, queueType, userContext } = queueData;

  return (
    <div className="space-y-6">
      {/* Queue Header & Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>My Approval Queue</span>
              <Badge variant="outline" className="ml-2">
                {userContext.role.replace('_', ' ').toUpperCase()}
                {userContext.department && ` - ${userContext.department.toUpperCase()}`}
              </Badge>
            </div>
            <Badge variant={items.length > 0 ? "default" : "secondary"}>
              {items.length} items
            </Badge>
          </CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalPending}</div>
              <div className="text-sm text-muted-foreground">Total Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.urgentTasks}</div>
              <div className="text-sm text-muted-foreground">Urgent Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.completedToday}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(metrics.currentLoad)}%</div>
              <div className="text-sm text-muted-foreground">Current Load</div>
            </div>
          </div>

          {/* Load Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workload Capacity</span>
              <span>{Math.round(metrics.currentLoad)}%</span>
            </div>
            <Progress 
              value={metrics.currentLoad} 
              className={`h-2 ${
                metrics.currentLoad > 80 ? 'bg-red-100' : 
                metrics.currentLoad > 60 ? 'bg-yellow-100' : 'bg-green-100'
              }`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Pending Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">
                No pending items in your queue right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    item.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPriorityIcon(item.priority)}
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <Badge variant={getPriorityColor(item.priority) as any}>
                          {item.priority.toUpperCase()}
                        </Badge>
                        {item.isOverdue && (
                          <Badge variant="destructive">OVERDUE</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{item.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>{formatCurrency(item.dealValue)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                        </div>
                        {item.stage && (
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-4 w-4 text-gray-400" />
                            <span>{item.stage}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.department && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.department.toUpperCase()} DEPT
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <Button size="sm" className="flex items-center space-x-1">
                        <span>{getActionButtonText(item.actionRequired)}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Queue Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(metrics.avgDealValue)}
                </div>
                <div className="text-sm text-blue-700">Average Deal Value</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {metrics.highPriorityTasks}
                </div>
                <div className="text-sm text-orange-700">High Priority Items</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {metrics.totalPending - metrics.overdueTasks}
                </div>
                <div className="text-sm text-green-700">On-Time Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}