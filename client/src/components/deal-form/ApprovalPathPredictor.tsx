import React, { useMemo } from "react";
import { Clock, Building2, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  determineRequiredApprover, 
  getApproverDetails,
  ApprovalRule 
} from "@/lib/approval-matrix";
import { useQuery } from "@tanstack/react-query";

interface ApprovalPathPredictorProps {
  dealValue: number;
  dealType: string;
  incentiveTypes: string[];
  onChange?: (prediction: ApprovalPrediction) => void;
}

interface ApprovalPrediction {
  stage1: DepartmentStage[];
  stage2: BusinessApprovalStage;
  totalTimelineRange: string;
  successRate: number;
}

interface DepartmentStage {
  department: string;
  displayName: string;
  reason: string;
  estimatedDays: string;
  status: 'auto-approved' | 'review-required' | 'not-required';
  icon: string;
}

interface BusinessApprovalStage {
  approver: ApprovalRule;
  estimatedDays: string;
  requirements: string[];
}

export function ApprovalPathPredictor({
  dealValue,
  dealType = "grow",
  incentiveTypes = [],
  onChange
}: ApprovalPathPredictorProps) {
  
  // Fetch department data for display names
  const { data: departmentData } = useQuery<any[]>({
    queryKey: ['/api/approval-departments']
  });

  const prediction = useMemo((): ApprovalPrediction => {
    // Determine business approval level
    const approverLevel = determineRequiredApprover(dealValue, dealType, incentiveTypes.includes('independent_agency') ? 'independent_agency' : 'client_direct');
    const businessApprover = getApproverDetails(approverLevel);
    
    // Core departments that always review
    const coreDepartments = ['finance', 'trading'];
    
    // Specialized department mapping
    const incentiveMapping: Record<string, string> = {
      'financial': 'finance',
      'resources': 'finance', 
      'product-innovation': 'creative',
      'technology': 'product',
      'analytics': 'solutions',
      'marketing': 'marketing'
    };
    
    // Determine required departments
    const specializedDepts = new Set<string>();
    incentiveTypes.forEach(incentive => {
      const dept = incentiveMapping[incentive];
      if (dept && !coreDepartments.includes(dept)) {
        specializedDepts.add(dept);
      }
    });
    
    const allDepartments = [...coreDepartments, ...Array.from(specializedDepts)];
    
    // Create department stages
    const stage1: DepartmentStage[] = allDepartments.map(dept => {
      const departmentInfo = departmentData?.find(d => d.department === dept);
      const displayName = departmentInfo?.displayName || getDefaultDisplayName(dept);
      
      let status: DepartmentStage['status'] = 'review-required';
      let reason = '';
      let estimatedDays = '2-3 days';
      
      if (dept === 'finance') {
        status = dealValue < 100000 ? 'auto-approved' : 'review-required';
        reason = coreDepartments.includes(dept) ? 'Core business review' : 'Financial incentive assessment';
        estimatedDays = status === 'auto-approved' ? '< 1 day' : '2-3 days';
      } else if (dept === 'trading') {
        status = 'review-required';
        reason = 'Margin and profitability analysis';
      } else if (dept === 'creative') {
        status = incentiveTypes.includes('product-innovation') ? 'review-required' : 'not-required';
        reason = 'Creative asset and innovation review';
      } else {
        reason = `${dept.charAt(0).toUpperCase() + dept.slice(1)} expertise required`;
      }
      
      return {
        department: dept,
        displayName,
        reason,
        estimatedDays,
        status,
        icon: getDepartmentIcon(dept)
      };
    });
    
    // Business approval stage
    const stage2: BusinessApprovalStage = {
      approver: businessApprover,
      estimatedDays: businessApprover.estimatedTime,
      requirements: [
        'All department reviews completed',
        'Business case validation',
        approverLevel === 'Executive' ? 'Comprehensive risk assessment' : 'Standard risk review'
      ]
    };
    
    // Calculate timeline
    const stage1Days = Math.max(...stage1.filter(s => s.status === 'review-required').map(() => 3), 1);
    const stage2Days = approverLevel === 'MD' ? 2 : 4; // Average of range
    const totalDays = stage1Days + stage2Days;
    
    const prediction: ApprovalPrediction = {
      stage1: stage1.filter(s => s.status !== 'not-required'),
      stage2,
      totalTimelineRange: `${totalDays-1}-${totalDays+1} business days`,
      successRate: calculateSuccessRate(dealValue, dealType, allDepartments.length)
    };
    
    return prediction;
  }, [dealValue, dealType, incentiveTypes, departmentData]);

  // Notify parent component
  React.useEffect(() => {
    if (onChange) {
      onChange(prediction);
    }
  }, [prediction, onChange]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          🔮 Predicted Approval Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Stage 1: Department Review */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Stage 1: Department Review (2-3 business days)
          </h4>
          
          <div className="space-y-3">
            {prediction.stage1.map((dept, index) => (
              <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg">{dept.icon}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{dept.displayName}</span>
                    <span className="text-xs text-muted-foreground">{dept.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dept.status === 'auto-approved' && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Auto-approved
                    </Badge>
                  )}
                  {dept.status === 'review-required' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Review required
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{dept.estimatedDays}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2: Business Approval */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Stage 2: Business Approval ({prediction.stage2.estimatedDays})
          </h4>
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">👤 {prediction.stage2.approver.title}</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Final approval
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {prediction.stage2.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              📅 Estimated Total Timeline
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {prediction.totalTimelineRange}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>🏃‍♂️ {prediction.successRate}% of similar deals approved within this timeframe</span>
          </div>
          
          <Progress value={prediction.successRate} className="mt-2 h-2" />
        </div>

      </CardContent>
    </Card>
  );
}

// Helper functions
function getDefaultDisplayName(department: string): string {
  const displayMap: Record<string, string> = {
    'finance': 'Finance Team',
    'trading': 'Trading Team', 
    'creative': 'Creative Team',
    'product': 'Product Team',
    'solutions': 'Solutions Team',
    'marketing': 'Marketing Team'
  };
  
  return displayMap[department] || department.charAt(0).toUpperCase() + department.slice(1) + ' Team';
}

function getDepartmentIcon(department: string): string {
  const iconMap: Record<string, string> = {
    'finance': '🏛️',
    'trading': '📈',
    'creative': '🎨',
    'product': '🛠️',
    'solutions': '💡',
    'marketing': '📢'
  };
  
  return iconMap[department] || '📋';
}

function calculateSuccessRate(dealValue: number, dealType: string, departmentCount: number): number {
  let baseRate = 85; // Base success rate
  
  // Adjust for deal characteristics
  if (dealValue > 500000) baseRate -= 10; // Higher value = more scrutiny
  if (dealType !== 'grow') baseRate -= 5; // Non-standard deals take longer
  if (departmentCount > 3) baseRate -= 5; // More departments = more complexity
  
  return Math.max(Math.min(baseRate, 95), 70); // Keep between 70-95%
}