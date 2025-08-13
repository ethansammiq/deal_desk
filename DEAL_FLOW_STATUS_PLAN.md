# Deal Flow & Status Management Implementation Plan

## 📊 **Current State Analysis**

### ✅ **What's Currently Working**
- **Deal Scoping Form**: RequestSupport.tsx handles initial deal scoping
- **Deal Submission Form**: SubmitDeal.tsx for detailed deal submission
- **Basic Status Tracking**: Schema supports limited statuses (`submitted`, `in_review`, `initial_approval`, `client_feedback`, `legal_review`, `signed`)
- **Dashboard**: Shows deals with basic status badges and filtering
- **Data Storage**: Both deal scoping requests and deals stored separately

### ❌ **Current Limitations**
1. **Disconnected Forms**: No direct conversion from scoping request → deal submission
2. **Limited Status Flow**: Only 6 statuses vs required 9 statuses
3. **No User Roles**: No role-based permissions or access control
4. **Basic Dashboard**: Lacks action center functionality for different user types
5. **No Lost Deal Tracking**: Missing granular lost deal categories
6. **Status Management**: No proper workflow controls for status transitions

---

## 🎯 **Target 9-Status Deal Flow Implementation**

### **Complete Status Lifecycle**
```mermaid
graph LR
    A[Scoping] → B[Submitted] → C[Under Review] → D[Negotiating] → E[Approved]
    E → F[Legal Review] → G[Contract Sent] → H[Signed]
    C → I[Lost]
    D → I[Lost]
    E → I[Lost]
    F → I[Lost]
    G → I[Lost]
```

### **Status Definitions & Ownership**
| Status | Owner | Description | Actions Available |
|--------|--------|-------------|------------------|
| **Scoping** | Seller | Initial deal scoping form submitted | Convert to Deal Submission |
| **Submitted** | Seller | Complete deal submission form submitted | View, Edit (if rejected) |
| **Under Review** | Approver | Deal being evaluated by approval team | Approve, Reject, Request Changes |
| **Negotiating** | Approver | Active negotiations with client | Approve, Mark as Lost |
| **Approved** | Approver | Deal approved, ready for legal | Send to Legal Review |
| **Legal Review** | Legal Team | Contract being reviewed by legal | Approve Contract, Request Changes |
| **Contract Sent** | Legal Team | Contract sent to client | Mark as Signed, Mark as Lost |
| **Signed** | Seller | Contract signed by client | Final status |
| **Lost** | Any (with reason) | Deal lost with categorization | Archive with reason |

### **Lost Deal Categories**
- **Commercial**: Pricing, terms, or commercial structure issues
- **Product**: Product limitations or technical requirements
- **Timing**: Timeline conflicts or urgency mismatches  
- **No Response**: Client stopped responding or ghosted
- **Internal**: Internal capacity or strategic changes
- **Others**: Custom reason provided

---

## 🏗️ **Implementation Architecture**

### **Phase 1: Database Schema Updates**

#### **1.1 Enhanced Deal Status System**
```sql
-- Add user roles table
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- 'seller', 'approver', 'legal', 'admin'
  department VARCHAR(100),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update deals table with enhanced status tracking
ALTER TABLE deals ADD COLUMN current_status VARCHAR(50) DEFAULT 'scoping';
ALTER TABLE deals ADD COLUMN status_history JSONB DEFAULT '[]';
ALTER TABLE deals ADD COLUMN assigned_to INTEGER REFERENCES users(id);
ALTER TABLE deals ADD COLUMN lost_reason VARCHAR(50);
ALTER TABLE deals ADD COLUMN lost_category VARCHAR(50);
ALTER TABLE deals ADD COLUMN lost_details TEXT;
ALTER TABLE deals ADD COLUMN last_status_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Status transition tracking
CREATE TABLE deal_status_history (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id),
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deal scoping to deal conversion tracking
ALTER TABLE deal_scoping_requests ADD COLUMN converted_deal_id INTEGER REFERENCES deals(id);
ALTER TABLE deal_scoping_requests ADD COLUMN converted_at TIMESTAMP;
```

#### **1.2 Drizzle Schema Updates**
```typescript
// Add to shared/schema.ts
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // 'seller', 'approver', 'legal', 'admin'
  department: text("department"),
  permissions: text("permissions"), // JSON string for role permissions
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealStatusHistory = pgTable("deal_status_history", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: integer("changed_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Update deals table schema
export const deals = pgTable("deals", {
  // ... existing fields
  currentStatus: text("current_status").default("scoping"),
  statusHistory: text("status_history"), // JSON string
  assignedTo: integer("assigned_to").references(() => users.id),
  lostReason: text("lost_reason"),
  lostCategory: text("lost_category"),
  lostDetails: text("lost_details"),
  lastStatusChange: timestamp("last_status_change").defaultNow(),
});

// Update deal scoping requests
export const dealScopingRequests = pgTable("deal_scoping_requests", {
  // ... existing fields
  convertedDealId: integer("converted_deal_id").references(() => deals.id),
  convertedAt: timestamp("converted_at"),
});
```

### **Phase 2: User Role & Permission System**

#### **2.1 Role-Based Access Control (RBAC)**
```typescript
// New file: shared/roles.ts
export const ROLES = {
  SELLER: 'seller',
  APPROVER: 'approver', 
  LEGAL: 'legal',
  ADMIN: 'admin'
} as const;

export const PERMISSIONS = {
  // Deal creation and editing
  CREATE_SCOPING_REQUEST: 'create_scoping_request',
  CREATE_DEAL_SUBMISSION: 'create_deal_submission',
  EDIT_OWN_DEALS: 'edit_own_deals',
  
  // Status transitions
  REVIEW_DEALS: 'review_deals',
  APPROVE_DEALS: 'approve_deals',
  LEGAL_REVIEW: 'legal_review',
  SEND_CONTRACTS: 'send_contracts',
  MARK_SIGNED: 'mark_signed',
  MARK_LOST: 'mark_lost',
  
  // Administrative
  VIEW_ALL_DEALS: 'view_all_deals',
  ASSIGN_DEALS: 'assign_deals',
  MANAGE_USERS: 'manage_users',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SELLER]: [
    PERMISSIONS.CREATE_SCOPING_REQUEST,
    PERMISSIONS.CREATE_DEAL_SUBMISSION,
    PERMISSIONS.EDIT_OWN_DEALS,
    PERMISSIONS.MARK_SIGNED,
    PERMISSIONS.MARK_LOST,
  ],
  [ROLES.APPROVER]: [
    PERMISSIONS.REVIEW_DEALS,
    PERMISSIONS.APPROVE_DEALS,
    PERMISSIONS.MARK_LOST,
    PERMISSIONS.VIEW_ALL_DEALS,
  ],
  [ROLES.LEGAL]: [
    PERMISSIONS.LEGAL_REVIEW,
    PERMISSIONS.SEND_CONTRACTS,
    PERMISSIONS.MARK_LOST,
    PERMISSIONS.VIEW_ALL_DEALS,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};
```

#### **2.2 Authentication Middleware**
```typescript
// New file: server/middleware/auth.ts
export async function requireRole(req: Request, res: Response, next: NextFunction, requiredRole: string) {
  try {
    const user = req.user; // From session/JWT
    const userRole = await storage.getUserRole(user.id);
    
    if (!userRole || userRole.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
}

export async function requirePermission(req: Request, res: Response, next: NextFunction, permission: string) {
  try {
    const user = req.user;
    const hasPermission = await checkUserPermission(user.id, permission);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
}
```

### **Phase 3: Deal Flow Connection System**

#### **3.1 Scoping Request → Deal Submission Conversion**
```typescript
// New file: client/src/hooks/useDealConversion.ts
export function useDealConversion() {
  const convertScopingToDeal = useMutation({
    mutationFn: async (scopingRequestId: number) => {
      const response = await apiRequest(`/api/deal-scoping-requests/${scopingRequestId}/convert`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to deal submission form with pre-filled data
      navigate(`/submit-deal?from-scoping=${data.dealId}`);
    },
  });

  return { convertScopingToDeal };
}
```

#### **3.2 Enhanced API Routes**
```typescript
// Add to server/routes.ts
router.post('/api/deal-scoping-requests/:id/convert', requirePermission(PERMISSIONS.CREATE_DEAL_SUBMISSION), async (req, res) => {
  try {
    const scopingRequest = await storage.getDealScopingRequest(parseInt(req.params.id));
    if (!scopingRequest) {
      return res.status(404).json({ error: 'Scoping request not found' });
    }

    // Create deal from scoping request data
    const dealData = {
      ...scopingRequest,
      dealStructure: 'tiered', // Default, can be changed in submission form
      currentStatus: 'submitted',
    };

    const deal = await storage.createDeal(dealData);
    
    // Update scoping request with conversion info
    await storage.updateDealScopingRequest(scopingRequest.id, {
      convertedDealId: deal.id,
      convertedAt: new Date(),
      status: 'converted',
    });

    res.json({ dealId: deal.id, message: 'Successfully converted to deal submission' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert scoping request' });
  }
});
```

### **Phase 4: Enhanced Dashboard & Action Center**

#### **4.1 Role-Based Dashboard Views**
```typescript
// New file: client/src/components/dashboard/RoleDashboard.tsx
interface RoleDashboardProps {
  userRole: string;
  userId: number;
}

export function RoleDashboard({ userRole, userId }: RoleDashboardProps) {
  switch (userRole) {
    case 'seller':
      return <SellerDashboard userId={userId} />;
    case 'approver':
      return <ApproverDashboard userId={userId} />;
    case 'legal':
      return <LegalDashboard userId={userId} />;
    case 'admin':
      return <AdminDashboard userId={userId} />;
    default:
      return <GuestDashboard />;
  }
}
```

#### **4.2 Seller Dashboard**
```typescript
// New file: client/src/components/dashboard/SellerDashboard.tsx
export function SellerDashboard({ userId }: { userId: number }) {
  const myDealsQuery = useQuery({
    queryKey: ['/api/deals/my-deals', userId],
    queryFn: () => apiRequest(`/api/deals/my-deals`),
  });

  const scopingRequestsQuery = useQuery({
    queryKey: ['/api/deal-scoping-requests/my-requests', userId],
    queryFn: () => apiRequest(`/api/deal-scoping-requests/my-requests`),
  });

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Start Deal Scoping"
          description="Begin with a scoping request"
          action={() => navigate('/request-support')}
          icon={<Search className="h-5 w-5" />}
        />
        <QuickActionCard
          title="Submit New Deal"
          description="Submit a complete deal"
          action={() => navigate('/submit-deal')}
          icon={<Plus className="h-5 w-5" />}
        />
        <QuickActionCard
          title="My Active Deals"
          description={`${myDealsQuery.data?.filter(d => !['signed', 'lost'].includes(d.currentStatus)).length || 0} active`}
          action={() => {/* Filter to active deals */}}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Pending Conversions */}
      <PendingConversionsSection scopingRequests={scopingRequestsQuery.data || []} />
      
      {/* My Deals by Status */}
      <MyDealsSection deals={myDealsQuery.data || []} />
    </div>
  );
}
```

#### **4.3 Approver Dashboard**
```typescript
// New file: client/src/components/dashboard/ApproverDashboard.tsx
export function ApproverDashboard({ userId }: { userId: number }) {
  const pendingReviewQuery = useQuery({
    queryKey: ['/api/deals/pending-review'],
    queryFn: () => apiRequest('/api/deals?status=under_review'),
  });

  const negotiatingQuery = useQuery({
    queryKey: ['/api/deals/negotiating'],
    queryFn: () => apiRequest('/api/deals?status=negotiating'),
  });

  return (
    <div className="space-y-6">
      {/* Approval Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Review"
          value={pendingReviewQuery.data?.length || 0}
          trend="warning"
          urgent={pendingReviewQuery.data?.filter(d => isUrgent(d.createdAt)).length}
        />
        <StatCard
          title="In Negotiation"
          value={negotiatingQuery.data?.length || 0}
          trend="info"
        />
        <StatCard
          title="Approved This Week"
          value={getWeeklyApprovals()}
          trend="up"
        />
        <StatCard
          title="Avg Review Time"
          value={`${getAverageReviewTime()} days`}
          trend="neutral"
        />
      </div>

      {/* Action Required Section */}
      <ActionRequiredSection deals={pendingReviewQuery.data || []} />
      
      {/* Deals in Negotiation */}
      <NegotiationSection deals={negotiatingQuery.data || []} />
    </div>
  );
}
```

#### **4.4 Status Management Components**
```typescript
// New file: client/src/components/deal-status/StatusTransitionModal.tsx
interface StatusTransitionModalProps {
  deal: Deal;
  availableTransitions: StatusTransition[];
  onStatusChange: (newStatus: string, reason?: string) => Promise<void>;
}

export function StatusTransitionModal({ deal, availableTransitions, onStatusChange }: StatusTransitionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reason, setReason] = useState('');
  const [lostCategory, setLostCategory] = useState('');

  const handleSubmit = async () => {
    if (selectedStatus === 'lost') {
      await onStatusChange(selectedStatus, reason, lostCategory);
    } else {
      await onStatusChange(selectedStatus, reason);
    }
  };

  return (
    <Modal>
      <div className="space-y-4">
        <h3>Update Deal Status</h3>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          {availableTransitions.map(transition => (
            <SelectItem key={transition.to} value={transition.to}>
              {transition.label}
            </SelectItem>
          ))}
        </Select>

        {selectedStatus === 'lost' && (
          <LostDealForm
            category={lostCategory}
            reason={reason}
            onCategoryChange={setLostCategory}
            onReasonChange={setReason}
          />
        )}

        <Button onClick={handleSubmit}>Update Status</Button>
      </div>
    </Modal>
  );
}
```

---

## 🔄 **Status Transition Rules**

### **Allowed Transitions by Role**
```typescript
export const STATUS_TRANSITIONS = {
  scoping: {
    seller: ['submitted'],
  },
  submitted: {
    approver: ['under_review', 'lost'],
    seller: ['scoping'], // If rejected
  },
  under_review: {
    approver: ['negotiating', 'approved', 'lost'],
  },
  negotiating: {
    approver: ['approved', 'lost'],
  },
  approved: {
    approver: ['legal_review'],
  },
  legal_review: {
    legal: ['contract_sent', 'negotiating', 'lost'], // Can send back to negotiation
  },
  contract_sent: {
    legal: ['signed', 'lost'],
    seller: ['signed'], // When client signs
  },
  signed: {
    // Final status - no transitions
  },
  lost: {
    // Final status - no transitions
  },
};
```

---

## 🚀 **Implementation Timeline**

### **Sprint 1 (Week 1-2): Database & Schema Updates**
- [ ] Update Drizzle schema with new tables
- [ ] Run database migrations
- [ ] Update storage interface with new methods
- [ ] Create user role management APIs

### **Sprint 2 (Week 3-4): Role-Based Access Control**
- [ ] Implement authentication middleware
- [ ] Create permission checking system
- [ ] Update API routes with role guards
- [ ] Add user role management UI

### **Sprint 3 (Week 5-6): Deal Flow Connection**
- [ ] Build scoping request → deal conversion
- [ ] Update SubmitDeal form to accept pre-filled data
- [ ] Add conversion tracking and history
- [ ] Create status transition system

### **Sprint 4 (Week 7-8): Enhanced Dashboard**
- [ ] Build role-specific dashboard views
- [ ] Create action center components
- [ ] Add status management modals
- [ ] Implement bulk actions for approvers

### **Sprint 5 (Week 9-10): Lost Deal Management**
- [ ] Build lost deal categorization system
- [ ] Add reporting and analytics for lost deals
- [ ] Create reactivation workflows
- [ ] Add export capabilities

---

## 🔮 **Future Enhancements (Phase 8+)**

### **Linksquare Integration**
- **Contract Sync**: Automatic status updates when contracts are created/sent in Linksquare
- **Signature Tracking**: Real-time updates when contracts are signed
- **Document Management**: Direct access to contract documents from deal records
- **API Webhooks**: Bidirectional sync between Deal Desk and Linksquare statuses

### **Advanced Features**
- **Automated Workflows**: Slack/email notifications for status changes
- **SLA Tracking**: Monitor time in each status with alerts
- **Bulk Operations**: Approve multiple deals, bulk status updates
- **Advanced Analytics**: Deal velocity, bottleneck analysis, success predictions
- **Mobile App**: On-the-go deal management for sales teams

---

This comprehensive plan transforms the current basic deal tracking into a professional workflow management system with proper role-based access control and seamless deal lifecycle management.