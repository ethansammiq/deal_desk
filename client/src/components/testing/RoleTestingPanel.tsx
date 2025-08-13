import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  FileCheck, 
  MessageSquare, 
  ArrowUpRight, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useDealActions } from "@/hooks/useDealActions";
import { useDealConversion } from "@/hooks/useDealConversion";
import { useCurrentUser } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

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
    userRole: "legal"
  },
  {
    id: "legal-contract",
    title: "Legal: Send Contract",
    description: "Legal team should be able to send contracts for approved deals",
    dealId: 6,
    dealStatus: "approved",
    expectedAction: "Send Contract",
    userRole: "legal"
  }
];

export default function RoleTestingPanel() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [activeTest, setActiveTest] = useState<string | null>(null);
  
  const { data: currentUser } = useCurrentUser();
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

  const dealsQuery = useQuery({
    queryKey: ['/api/deals'],
  });

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
          throw new Error("Unknown test scenario");
      }

      setTestResults(prev => ({ ...prev, [scenario.id]: 'success' }));
    } catch (error) {
      console.error(`Test ${scenario.id} failed:`, error);
      setTestResults(prev => ({ ...prev, [scenario.id]: 'error' }));
    } finally {
      setActiveTest(null);
    }
  };

  const getStatusIcon = (result: 'pending' | 'success' | 'error' | undefined) => {
    switch (result) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const isTestRunning = activeTest !== null || isUpdatingStatus || isSendingNudge || 
                      isApproving || isLegalApproving || isSendingContract;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role-Based Action Testing</h1>
          <p className="text-slate-500 mt-1">Test action handlers across different user roles</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Current Role:</span>
          <Badge variant="outline" className="capitalize">
            {currentUser?.role || 'Unknown'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{scenario.title}</CardTitle>
                    {getStatusIcon(testResults[scenario.id])}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600">{scenario.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Deal ID:</span>
                      <span className="font-mono">{scenario.dealId}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Status:</span>
                      <Badge variant="outline" className="text-xs">{scenario.dealStatus}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Role:</span>
                      <Badge variant="secondary" className="text-xs capitalize">{scenario.userRole}</Badge>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => runTest(scenario)}
                    disabled={isTestRunning}
                    variant={testResults[scenario.id] === 'success' ? 'outline' : 'default'}
                  >
                    {activeTest === scenario.id ? 'Running...' : 
                     testResults[scenario.id] === 'success' ? 'Test Passed' : 
                     'Run Test'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testScenarios.map((scenario) => {
                  const result = testResults[scenario.id];
                  return (
                    <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <p className="font-medium text-sm">{scenario.title}</p>
                          <p className="text-xs text-slate-500">Expected: {scenario.expectedAction}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={result === 'success' ? 'default' : result === 'error' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {result === 'success' ? 'Passed' : 
                           result === 'error' ? 'Failed' : 
                           result === 'pending' ? 'Running' : 'Not Run'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}