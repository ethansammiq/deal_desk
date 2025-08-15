// Consolidated Testing Interface - Comprehensive role and workflow testing
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { RoleSwitcher } from "@/components/ui/role-switcher";
import { PermissionComparison } from "@/components/ui/permission-comparison";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/usePermissions";
import { useAllowedTransitions } from "@/hooks/useAllowedTransitions";
import { useDealActions } from "@/hooks/useDealActions";
import { useDealConversion } from "@/hooks/useDealConversion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TestTube2, 
  Activity, 
  Settings, 
  User, 
  FileCheck, 
  MessageSquare, 
  ArrowUpRight, 
  CheckCircle,
  AlertTriangle,
  Cog
} from "lucide-react";
import type { Deal, DealStatus } from "@shared/schema";

interface TestScenario {
  id: string;
  title: string;
  description: string;
  dealId: number;
  dealStatus: string;
  expectedAction: string;
  userRole: string;
}

const testScenarios: TestScenario[] = [
  {
    id: "seller-convert",
    title: "Seller: Convert Scoping to Deal",
    description: "Sellers should be able to convert scoping requests to deal submissions",
    dealId: 1,
    dealStatus: "scoping",
    expectedAction: "Convert to Deal",
    userRole: "seller"
  },
  {
    id: "seller-nudge",
    title: "Seller: Nudge Approver", 
    description: "Sellers should be able to nudge approvers for deals under review",
    dealId: 2,
    dealStatus: "under_review",
    expectedAction: "Send Nudge",
    userRole: "seller"
  },
  {
    id: "approver-approve",
    title: "Approver: Approve Deal",
    description: "Approvers should be able to approve deals under review",
    dealId: 3,
    dealStatus: "under_review", 
    expectedAction: "Review & Approve",
    userRole: "approver"
  },
  {
    id: "approver-nudge-legal",
    title: "Approver: Nudge Legal",
    description: "Approvers should be able to nudge legal team for deals in legal review",
    dealId: 4,
    dealStatus: "legal_review",
    expectedAction: "Nudge Legal",
    userRole: "approver"
  },
  {
    id: "legal-review",
    title: "Legal: Complete Review",
    description: "Legal team should be able to complete legal reviews",
    dealId: 5,
    dealStatus: "legal_review",
    expectedAction: "Legal Review",
    userRole: "department_reviewer",
    department: "legal"
  },
  {
    id: "legal-contract",
    title: "Legal: Send Contract",
    description: "Legal team should be able to send contracts after review completion",
    dealId: 6,
    dealStatus: "approved",
    expectedAction: "Send Contract",
    userRole: "department_reviewer",
    department: "legal"
  }
];

export default function Testing() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [activeTest, setActiveTest] = useState<string | null>(null);
  
  const { data: currentUser } = useCurrentUser();
  const { canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  const { 
    sendNudge, 
    approveDeal, 
    legalApproveDeal, 
    sendContract,
    updateDealStatus,
    isUpdatingStatus,
    isSendingNudge,
    isApproving,
    isLegalApproving,
    isSendingContract
  } = useDealActions();
  
  const { convertScopingToDeal } = useDealConversion();

  const testStatuses: DealStatus[] = ["scoping", "submitted", "under_review", "negotiating", "approved"];
  
  // Always call hooks before any early returns
  const testTransitions = [
    useAllowedTransitions(1, "scoping"),
    useAllowedTransitions(1, "submitted"), 
    useAllowedTransitions(1, "under_review"),
    useAllowedTransitions(1, "negotiating"),
    useAllowedTransitions(1, "approved")
  ];

  const runTest = async (scenario: TestScenario) => {
    setActiveTest(scenario.id);
    setTestResults(prev => ({ ...prev, [scenario.id]: 'pending' }));

    try {
      // First, ensure the deal is in the correct status for testing
      await updateDealStatus.mutateAsync({
        dealId: scenario.dealId,
        status: scenario.dealStatus,
        comments: `Setting up test scenario: ${scenario.title}`
      });

      // Wait a moment for the status update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Run the specific test based on scenario
      switch (scenario.id) {
        case "seller-convert":
          await convertScopingToDeal.mutateAsync(scenario.dealId);
          break;
        case "seller-nudge":
          await sendNudge.mutateAsync({
            dealId: scenario.dealId,
            targetRole: "approver",
            message: "Test nudge from seller to approver"
          });
          break;
        case "approver-approve":
          await approveDeal.mutateAsync({
            dealId: scenario.dealId,
            comments: "Test approval from approver role"
          });
          break;
        case "approver-nudge-legal":
          await sendNudge.mutateAsync({
            dealId: scenario.dealId,
            targetRole: "legal",
            message: "Test nudge from approver to legal team"
          });
          break;
        case "legal-review":
          await legalApproveDeal.mutateAsync({
            dealId: scenario.dealId,
            comments: "Test legal review completion"
          });
          break;
        case "legal-contract":
          await sendContract.mutateAsync({
            dealId: scenario.dealId,
            comments: "Test contract sending"
          });
          break;
        default:
          throw new Error(`Unknown test scenario: ${scenario.id}`);
      }

      setTestResults(prev => ({ ...prev, [scenario.id]: 'success' }));
    } catch (error) {
      console.error(`Test ${scenario.id} failed:`, error);
      setTestResults(prev => ({ ...prev, [scenario.id]: 'error' }));
    } finally {
      setActiveTest(null);
    }
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <TestTube2 className="h-8 w-8 text-purple-600" />
          <span>Testing Interface</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive testing environment for role-based permissions, workflow actions, and user management functionality. 
          Switch between different roles and test real system behaviors safely.
        </p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Role Testing</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Workflow Testing</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <TestTube2 className="h-4 w-4" />
            <span>Permission Matrix</span>
          </TabsTrigger>
          <TabsTrigger value="transitions" className="flex items-center space-x-2">
            <ArrowUpRight className="h-4 w-4" />
            <span>Status Transitions</span>
          </TabsTrigger>
        </TabsList>

        {/* Role Testing Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Current User Status</span>
                </CardTitle>
                <CardDescription>Your active role and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRoleBadge role={currentUser.role} />
                  <span className="text-sm text-gray-600">
                    {currentUser.username} ({currentUser.email})
                  </span>
                </div>
                
                {currentUser.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Department</Badge>
                    <span className="capitalize">{currentUser.department}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {canCreateDeals ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    Create Deals
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewAllDeals ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    View All Deals
                  </div>
                  <div className="flex items-center gap-2">
                    {canApproveDeals ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    Approve Deals
                  </div>
                  <div className="flex items-center gap-2">
                    {canAccessLegalReview ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    Legal Review
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cog className="h-5 w-5" />
                  <span>Role Switcher</span>
                </CardTitle>
                <CardDescription>Test different roles and permissions (dev mode)</CardDescription>
              </CardHeader>
              <CardContent>
                <RoleSwitcher 
                  currentRole={currentUser.role}
                  onRoleChange={(role, department) => {
                    console.log('Switching to role:', role, department);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow Testing Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Live Workflow Testing</span>
              </CardTitle>
              <CardDescription>
                Test real workflow actions with your current role. Each test sets up the required deal status and executes the action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {testScenarios.map((scenario) => {
                  const result = testResults[scenario.id];
                  const isRunning = activeTest === scenario.id;
                  
                  return (
                    <div key={scenario.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {scenario.userRole}
                            </Badge>
                            <h4 className="font-medium">{scenario.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{scenario.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Deal ID: {scenario.dealId}</span>
                            <span>Status: {scenario.dealStatus}</span>
                            <span>Action: {scenario.expectedAction}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              result === 'success' ? 'default' : 
                              result === 'error' ? 'destructive' : 
                              result === 'pending' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {result === 'success' ? 'Passed' : 
                             result === 'error' ? 'Failed' : 
                             result === 'pending' ? 'Running' : 'Not Run'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => runTest(scenario)}
                            disabled={isRunning || result === 'pending'}
                          >
                            {isRunning ? 'Running...' : 'Run Test'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube2 className="h-5 w-5" />
                <span>Permission Comparison Matrix</span>
              </CardTitle>
              <CardDescription>
                Compare permissions across all roles and departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionComparison />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Transitions Tab */}
        <TabsContent value="transitions" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use Status Transition Testing</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Current Status</strong>: Shows a deal's current status (starting point)</p>
              <p>• <strong>Allowed Transitions</strong>: Shows what statuses your role can change this deal to</p>
              <p>• <strong>Role-Based</strong>: Different roles see different allowed transitions</p>
              <p>• <strong>Live Testing</strong>: Use the "Workflow Testing" tab to actually perform these transitions</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpRight className="h-5 w-5" />
                  <span>Status Transition Rules</span>
                </CardTitle>
                <CardDescription>
                  Shows which status changes your current role ({currentUser.role}) can make
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testStatuses.map((status, index) => {
                  const allowedTransitions = testTransitions[index];
                  return (
                    <div key={status} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">{status.replace('_', ' ')}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {allowedTransitions.data?.length || 0} transitions
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allowedTransitions.data?.length ? (
                          allowedTransitions.data.map((transition) => (
                            <Badge key={transition} variant="secondary" className="text-xs capitalize">
                              → {transition.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No transitions allowed from this status</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5" />
                  <span>API Access Testing</span>
                </CardTitle>
                <CardDescription>
                  Test which API endpoints you can access with your current role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">GET /api/deals</span>
                    <Badge variant={canViewAllDeals ? "default" : "secondary"} className="text-xs">
                      {canViewAllDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">POST /api/deals</span>
                    <Badge variant={canCreateDeals ? "default" : "secondary"} className="text-xs">
                      {canCreateDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">PUT /api/deals/:id/status</span>
                    <Badge variant={canApproveDeals ? "default" : "secondary"} className="text-xs">
                      {canApproveDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">GET /api/legal/contracts</span>
                    <Badge variant={canAccessLegalReview ? "default" : "secondary"} className="text-xs">
                      {canAccessLegalReview ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}