# Role-Driven Experience - Technical Implementation Specification

## **IMPLEMENTATION ROADMAP**

### **🎯 PHASE 1: Foundation - Role-Adaptive Dashboard Framework**

#### **1.1 Enhanced Role Schema**
```typescript
// shared/schema.ts - Enhanced role permissions
export interface DashboardLayout {
  sections: DashboardSection[];
  primaryActions: string[];
  informationPriority: 'minimal' | 'standard' | 'comprehensive';
  refreshInterval: number; // milliseconds
}

export interface DashboardSection {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full-width';
  position: { row: number; col: number };
  collapsible: boolean;
  defaultExpanded: boolean;
}

export const roleDashboardLayouts: Record<UserRole, DashboardLayout> = {
  seller: {
    sections: [
      { id: 'my-deals-summary', title: 'My Deals Overview', component: 'DealsSummaryCard', size: 'medium', position: { row: 1, col: 1 }, collapsible: false, defaultExpanded: true },
      { id: 'active-drafts', title: 'Active Drafts', component: 'DraftManagementCard', size: 'medium', position: { row: 1, col: 2 }, collapsible: true, defaultExpanded: true },
      { id: 'priority-actions', title: 'Next Actions', component: 'SellerPriorityActions', size: 'full-width', position: { row: 2, col: 1 }, collapsible: false, defaultExpanded: true },
      { id: 'deal-pipeline', title: 'Deal Progress', component: 'SellerPipeline', size: 'large', position: { row: 3, col: 1 }, collapsible: true, defaultExpanded: false }
    ],
    primaryActions: ['submit-deal', 'resume-draft', 'respond-to-feedback'],
    informationPriority: 'standard',
    refreshInterval: 60000
  },
  approver: {
    sections: [
      { id: 'review-queue-critical', title: 'Critical Reviews', component: 'CriticalReviewQueue', size: 'full-width', position: { row: 1, col: 1 }, collapsible: false, defaultExpanded: true },
      { id: 'sla-alerts', title: 'SLA Risks', component: 'SLAAlertCard', size: 'medium', position: { row: 2, col: 1 }, collapsible: false, defaultExpanded: true },
      { id: 'approval-metrics', title: 'My Performance', component: 'ApprovalMetricsCard', size: 'medium', position: { row: 2, col: 2 }, collapsible: true, defaultExpanded: false },
      { id: 'department-workload', title: 'Team Workload', component: 'DepartmentWorkloadCard', size: 'large', position: { row: 3, col: 1 }, collapsible: true, defaultExpanded: false }
    ],
    primaryActions: ['approve-deal', 'request-revision', 'bulk-approve'],
    informationPriority: 'comprehensive',
    refreshInterval: 30000
  },
  department_reviewer: {
    sections: [
      { id: 'department-queue', title: 'My Department Queue', component: 'DepartmentReviewQueue', size: 'full-width', position: { row: 1, col: 1 }, collapsible: false, defaultExpanded: true },
      { id: 'technical-context', title: 'Technical Resources', component: 'TechnicalContextCard', size: 'medium', position: { row: 2, col: 1 }, collapsible: true, defaultExpanded: false },
      { id: 'peer-workload', title: 'Team Distribution', component: 'PeerWorkloadCard', size: 'medium', position: { row: 2, col: 2 }, collapsible: true, defaultExpanded: false }
    ],
    primaryActions: ['technical-review', 'escalate-to-senior', 'request-consultation'],
    informationPriority: 'standard',
    refreshInterval: 45000
  }
  // ... other roles
};
```

#### **1.2 Role-Adaptive Dashboard Component**
```typescript
// client/src/components/dashboard/RoleAdaptiveDashboard.tsx
interface RoleAdaptiveDashboardProps {
  userRole: UserRole;
  userId: number;
}

export function RoleAdaptiveDashboard({ userRole, userId }: RoleAdaptiveDashboardProps) {
  const layout = roleDashboardLayouts[userRole];
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(layout.sections.filter(s => s.defaultExpanded).map(s => s.id))
  );
  
  // Role-specific data hook
  const { data, isLoading, error } = useRoleAdaptiveData(userRole, userId, {
    refreshInterval: layout.refreshInterval
  });
  
  // Dynamic section rendering
  const renderSection = (section: DashboardSection) => {
    const SectionComponent = getDashboardComponent(section.component);
    const sectionData = data?.[section.id];
    
    return (
      <DashboardCard
        key={section.id}
        title={section.title}
        size={section.size}
        collapsible={section.collapsible}
        expanded={expandedSections.has(section.id)}
        onExpandChange={(expanded) => {
          const newExpanded = new Set(expandedSections);
          if (expanded) {
            newExpanded.add(section.id);
          } else {
            newExpanded.delete(section.id);
          }
          setExpandedSections(newExpanded);
        }}
      >
        <SectionComponent 
          data={sectionData}
          userRole={userRole}
          onAction={(action) => handleRoleAction(userRole, action)}
        />
      </DashboardCard>
    );
  };
  
  return (
    <div className="role-adaptive-dashboard">
      <DashboardHeader 
        userRole={userRole}
        primaryActions={layout.primaryActions}
        onPrimaryAction={handlePrimaryAction}
      />
      
      <DashboardGrid layout={layout}>
        {layout.sections.map(renderSection)}
      </DashboardGrid>
    </div>
  );
}
```

#### **1.3 Consolidated Data Layer**
```typescript
// client/src/hooks/useRoleAdaptiveData.ts
export function useRoleAdaptiveData(userRole: UserRole, userId: number, options: { refreshInterval: number }) {
  // Base queries all roles need
  const { data: deals } = useQuery(['/api/deals'], { staleTime: 30000 });
  const { data: userStats } = useQuery([`/api/users/${userId}/stats`], { staleTime: 60000 });
  
  // Role-specific data fetching
  const roleQueries = useMemo(() => {
    switch (userRole) {
      case 'seller':
        return {
          'my-deals-summary': useQuery([`/api/deals/user/${userId}/summary`]),
          'active-drafts': useQuery([`/api/deals/user/${userId}/drafts`]),
          'priority-actions': useQuery([`/api/priority-items/seller/${userId}`]),
          'deal-pipeline': useQuery([`/api/deals/user/${userId}/pipeline`])
        };
        
      case 'approver':
        return {
          'review-queue-critical': useQuery(['/api/approvals/critical']),
          'sla-alerts': useQuery(['/api/sla-alerts/approver']),
          'approval-metrics': useQuery([`/api/users/${userId}/approval-metrics`]),
          'department-workload': useQuery(['/api/department-workload/approver'])
        };
        
      case 'department_reviewer':
        return {
          'department-queue': useQuery([`/api/department-queue/${userRole}`]),
          'technical-context': useQuery([`/api/technical-resources/${userRole}`]),
          'peer-workload': useQuery([`/api/peer-workload/${userId}`])
        };
        
      default:
        return {};
    }
  }, [userRole, userId]);
  
  // Combine all query results
  const combinedData = useMemo(() => {
    const result: Record<string, any> = {};
    Object.entries(roleQueries).forEach(([key, query]) => {
      result[key] = query.data;
    });
    return result;
  }, [roleQueries]);
  
  return {
    data: combinedData,
    isLoading: Object.values(roleQueries).some(q => q.isLoading),
    error: Object.values(roleQueries).find(q => q.error)?.error
  };
}
```

---

### **🎯 PHASE 2: Role-Specific Components**

#### **2.1 Seller-Focused Components**
```typescript
// client/src/components/role-specific/SellerPriorityActions.tsx
export function SellerPriorityActions({ data, onAction }: SellerComponentProps) {
  const priorityItems = data?.priorityItems || [];
  
  // Group actions by urgency for sellers
  const groupedActions = useMemo(() => {
    return {
      drafts: priorityItems.filter(item => item.actionType === 'resume_draft'),
      revisions: priorityItems.filter(item => item.actionType === 'respond_to_revision'),
      submissions: priorityItems.filter(item => item.actionType === 'submit_deal'),
      followups: priorityItems.filter(item => item.actionType === 'follow_up')
    };
  }, [priorityItems]);
  
  return (
    <div className="seller-priority-actions space-y-4">
      {/* Urgent Actions - Red Alert Style */}
      {groupedActions.revisions.length > 0 && (
        <ActionGroup
          title="Revision Required"
          items={groupedActions.revisions}
          variant="critical"
          onAction={onAction}
        />
      )}
      
      {/* Active Work - Yellow Warning Style */}
      {groupedActions.drafts.length > 0 && (
        <ActionGroup
          title="Continue Working"
          items={groupedActions.drafts}
          variant="warning"
          onAction={onAction}
        />
      )}
      
      {/* Ready to Submit - Blue Info Style */}
      {groupedActions.submissions.length > 0 && (
        <ActionGroup
          title="Ready to Submit"
          items={groupedActions.submissions}
          variant="info"
          onAction={onAction}
        />
      )}
    </div>
  );
}
```

#### **2.2 Approver-Focused Components**
```typescript
// client/src/components/role-specific/CriticalReviewQueue.tsx
export function CriticalReviewQueue({ data, onAction }: ApproverComponentProps) {
  const criticalReviews = data?.criticalReviews || [];
  
  return (
    <div className="critical-review-queue">
      <div className="queue-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Critical Reviews ({criticalReviews.length})
        </h3>
        <div className="queue-actions">
          <Button variant="outline" size="sm" onClick={() => onAction('bulk_approve')}>
            Bulk Actions
          </Button>
        </div>
      </div>
      
      <div className="review-list space-y-3">
        {criticalReviews.map((review: any) => (
          <ReviewCard
            key={review.id}
            review={review}
            variant="critical"
            showSLABadge={true}
            showApprovalContext={true}
            onQuickApprove={(id) => onAction('quick_approve', { dealId: id })}
            onRequestRevision={(id) => onAction('request_revision', { dealId: id })}
            onViewDetails={(id) => onAction('view_details', { dealId: id })}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### **🎯 PHASE 3: Smart Action System**

#### **3.1 Contextual Action Intelligence**
```typescript
// shared/services/contextualActionService.ts
export interface ContextualAction {
  id: string;
  type: 'primary' | 'secondary' | 'tertiary';
  label: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  deadline?: Date;
  context: {
    reason: string; // Why this action is suggested
    impact: string; // What happens if not completed
    difficulty: 'easy' | 'medium' | 'complex';
  };
  action: {
    handler: string;
    params: Record<string, any>;
    confirmationRequired: boolean;
  };
}

export class ContextualActionService {
  static generateActionsForRole(userRole: UserRole, userData: any): ContextualAction[] {
    const actions: ContextualAction[] = [];
    
    switch (userRole) {
      case 'seller':
        // Priority: Respond to revisions > Continue drafts > Submit ready deals
        if (userData.pendingRevisions?.length > 0) {
          actions.push({
            id: 'respond_revisions',
            type: 'primary',
            label: `Respond to ${userData.pendingRevisions.length} revision(s)`,
            description: 'Deals requiring your updates',
            urgency: 'critical',
            context: {
              reason: 'Approvers are waiting for your response',
              impact: 'Deals will be delayed and may miss deadlines',
              difficulty: 'medium'
            },
            action: {
              handler: 'navigateToRevisions',
              params: { revisions: userData.pendingRevisions },
              confirmationRequired: false
            }
          });
        }
        break;
        
      case 'approver':
        // Priority: SLA breaches > High-value deals > Normal queue
        if (userData.slaBreaches?.length > 0) {
          actions.push({
            id: 'urgent_approvals',
            type: 'primary',
            label: `${userData.slaBreaches.length} urgent approval(s)`,
            description: 'Overdue deals requiring immediate attention',
            urgency: 'critical',
            deadline: userData.slaBreaches[0].deadline,
            context: {
              reason: 'These deals have exceeded their SLA deadlines',
              impact: 'Client satisfaction and deal velocity will be impacted',
              difficulty: 'easy'
            },
            action: {
              handler: 'openUrgentApprovals',
              params: { dealIds: userData.slaBreaches.map(b => b.dealId) },
              confirmationRequired: false
            }
          });
        }
        break;
    }
    
    return actions.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }
}
```

#### **3.2 Smart Action Bar Component**
```typescript
// client/src/components/actions/SmartActionBar.tsx
export function SmartActionBar({ userRole, userData, onAction }: SmartActionBarProps) {
  const contextualActions = useMemo(() => {
    return ContextualActionService.generateActionsForRole(userRole, userData);
  }, [userRole, userData]);
  
  const primaryActions = contextualActions.filter(a => a.type === 'primary').slice(0, 3);
  const secondaryActions = contextualActions.filter(a => a.type === 'secondary').slice(0, 2);
  
  return (
    <div className="smart-action-bar bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-6">
      <div className="action-header mb-3">
        <h3 className="font-semibold text-gray-800">Recommended Actions</h3>
        <p className="text-sm text-gray-600">Based on your current workload and priorities</p>
      </div>
      
      <div className="actions-grid grid grid-cols-1 md:grid-cols-3 gap-3">
        {primaryActions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            variant="primary"
            priority={index + 1}
            onExecute={() => handleAction(action)}
          />
        ))}
      </div>
      
      {secondaryActions.length > 0 && (
        <div className="secondary-actions mt-4 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            {secondaryActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleAction(action)}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## **IMPLEMENTATION TIMELINE**

### **Week 1: Foundation**
- [ ] Implement enhanced role schema with dashboard layouts
- [ ] Create RoleAdaptiveDashboard component framework
- [ ] Build consolidated data hook (useRoleAdaptiveData)
- [ ] Replace existing UnifiedDashboard with role-adaptive version

### **Week 2: Seller Experience**  
- [ ] Build seller-specific components (SellerPriorityActions, DraftManagementCard)
- [ ] Implement seller dashboard layout
- [ ] Test seller workflow end-to-end
- [ ] Gather initial user feedback

### **Week 3: Approver Experience**
- [ ] Build approver-specific components (CriticalReviewQueue, SLAAlertCard)
- [ ] Integrate existing SLA monitoring into approver dashboard
- [ ] Implement bulk action capabilities
- [ ] Performance testing with multiple concurrent approvers

### **Week 4: Smart Actions**
- [ ] Implement ContextualActionService
- [ ] Build SmartActionBar component
- [ ] Add action intelligence across all roles
- [ ] A/B testing on action recommendations

### **Week 5-6: Polish & Advanced Features**
- [ ] Implement remaining roles (legal, department_reviewer, admin)
- [ ] Add personalization features
- [ ] Performance optimization
- [ ] Comprehensive testing and bug fixes

---

This technical specification provides a clear roadmap for consolidating the fragmented approval management system into a cohesive, role-driven experience that surfaces the right information and actions for each user type.