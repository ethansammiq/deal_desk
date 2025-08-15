import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Timer,
  CheckCircle,
  XCircle,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SLAMetrics {
  totalApprovals: number;
  onTimeCompletions: number;
  overdueItems: number;
  avgCompletionTime: number;
  slaComplianceRate: number;
  criticalBreaches: number;
  upcomingDeadlines: number;
}

interface SLAItem {
  id: number;
  dealId: number;
  dealName: string;
  department: string;
  priority: 'normal' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  slaTarget: number; // hours
  timeRemaining: number; // hours (negative if overdue)
  riskLevel: 'safe' | 'warning' | 'critical' | 'overdue';
  assignedTo?: string;
  clientName: string;
  dealValue: number;
}

interface DepartmentSLA {
  department: string;
  displayName: string;
  complianceRate: number;
  avgCompletionTime: number;
  overdueCount: number;
  slaTarget: number;
  trend: 'up' | 'down' | 'stable';
  riskItems: number;
}

export function SLAMonitoringDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch SLA metrics
  const { data: slaMetrics, isLoading: metricsLoading } = useQuery<SLAMetrics>({
    queryKey: [`/api/sla-metrics/${selectedTimeframe}`],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch SLA items with real-time status
  const { data: slaItems = [], isLoading: itemsLoading } = useQuery<SLAItem[]>({
    queryKey: [`/api/sla-items/${selectedDepartment}`],
    refetchInterval: 60000,
  });

  // Fetch department SLA performance
  const { data: departmentSLA = [] } = useQuery<DepartmentSLA[]>({
    queryKey: ['/api/department-sla-performance'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch departments for filter
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'overdue':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'overdue':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 0) {
      return `${Math.abs(hours)}h overdue`;
    }
    if (hours < 1) {
      return `${Math.round(hours * 60)}m remaining`;
    }
    if (hours < 24) {
      return `${Math.round(hours)}h remaining`;
    }
    return `${Math.round(hours / 24)}d remaining`;
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Sort items by urgency (overdue first, then by time remaining)
  const sortedItems = [...slaItems].sort((a, b) => {
    if (a.riskLevel === 'overdue' && b.riskLevel !== 'overdue') return -1;
    if (b.riskLevel === 'overdue' && a.riskLevel !== 'overdue') return 1;
    return a.timeRemaining - b.timeRemaining;
  });

  if (metricsLoading || itemsLoading) {
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
          <h1 className="text-2xl font-bold">SLA Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time deadline tracking and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Critical Alerts */}
      {(slaMetrics?.criticalBreaches || 0) > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{slaMetrics?.criticalBreaches || 0} critical SLA breaches</strong> require immediate attention.
            {(slaMetrics?.upcomingDeadlines || 0) > 0 && (
              <span> Additionally, {slaMetrics?.upcomingDeadlines || 0} items are approaching their deadlines.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="h-4 w-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(slaMetrics?.slaComplianceRate || 0)}`}>
              {slaMetrics?.slaComplianceRate || 0}%
            </div>
            <p className="text-sm text-gray-600">On-time completion rate</p>
            <Progress 
              value={slaMetrics?.slaComplianceRate || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaMetrics?.avgCompletionTime || 0}h</div>
            <p className="text-sm text-gray-600">Average processing time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{slaMetrics?.overdueItems || 0}</div>
            <p className="text-sm text-gray-600">Past deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{slaMetrics?.upcomingDeadlines || 0}</div>
            <p className="text-sm text-gray-600">Due within 4 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department SLA Performance</CardTitle>
          <CardDescription>Compliance rates and trends by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentSLA.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{dept.displayName}</h4>
                    <Badge className={`${getComplianceColor(dept.complianceRate)} bg-transparent border`}>
                      {dept.complianceRate}% compliance
                    </Badge>
                    {dept.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {dept.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Avg Time: {dept.avgCompletionTime}h</div>
                    <div>Target: {dept.slaTarget}h</div>
                    <div>
                      {dept.overdueCount > 0 ? (
                        <span className="text-red-600">{dept.overdueCount} overdue</span>
                      ) : (
                        <span className="text-green-600">On track</span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={dept.complianceRate} 
                    className="mt-2 h-2"
                  />
                </div>
                {dept.riskItems > 0 && (
                  <div className="ml-4">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {dept.riskItems} at risk
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-Time SLA Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Real-Time SLA Tracking
          </CardTitle>
          <CardDescription>
            Live countdown for all pending approvals (updates every minute)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending items requiring SLA monitoring
              </div>
            ) : (
              sortedItems.map((item) => (
                <div 
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.riskLevel === 'overdue' ? 'border-red-200 bg-red-50' :
                    item.riskLevel === 'critical' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{item.dealName}</h4>
                        <Badge className={getRiskColor(item.riskLevel)}>
                          {getRiskIcon(item.riskLevel)}
                          {item.riskLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.department}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>Client: {item.clientName}</div>
                        <div>Value: ${item.dealValue.toLocaleString()}</div>
                        <div>
                          Target: {item.slaTarget}h
                        </div>
                        {item.assignedTo && (
                          <div>Assigned: {item.assignedTo}</div>
                        )}
                      </div>

                      {/* Real-time countdown */}
                      <div className="flex items-center gap-4">
                        <div className={`font-medium ${
                          item.timeRemaining < 0 ? 'text-red-600' :
                          item.timeRemaining < 4 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {formatTimeRemaining(item.timeRemaining)}
                        </div>
                        <div className="flex-1">
                          <Progress 
                            value={item.timeRemaining < 0 ? 100 : Math.max(0, 100 - ((item.slaTarget - item.timeRemaining) / item.slaTarget * 100))}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant={item.riskLevel === 'overdue' ? 'destructive' : item.riskLevel === 'critical' ? 'default' : 'outline'}
                        onClick={() => window.open(`/deals/${item.dealId}`, '_blank')}
                      >
                        {item.riskLevel === 'overdue' ? 'Urgent Review' : 'Review'}
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