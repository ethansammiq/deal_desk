import { 
  users, 
  deals,
  dealScopingRequests,
  advertisers,
  agencies,
  dealTiers,
  incentiveValues,
  dealStatusHistory,
  dealApprovals,
  approvalActions,
  approvalDepartments,
  type User, 
  type InsertUser, 
  type Deal, 
  type InsertDeal,
  type DealScopingRequest,
  type InsertDealScopingRequest,
  type Advertiser,
  type InsertAdvertiser,
  type Agency,
  type InsertAgency,
  type DealTier,
  type InsertDealTier,
  type IncentiveValue,
  type InsertIncentiveValue,
  type DealStatusHistory,
  type InsertDealStatusHistory,
  type DealApproval,
  type InsertDealApproval,
  type ApprovalAction,
  type InsertApprovalAction,
  type ApprovalDepartment,
  type InsertApprovalDepartment,
  type DepartmentType,
  DEAL_STATUSES,
  type DealStatus
} from "@shared/schema";
import { AirtableStorage } from "./airtableStorage";

// Interface for storage operations
export interface IStorage {
  // Phase 7B: Enhanced user methods with role support
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
  // Advertiser methods
  getAdvertiser(id: number): Promise<Advertiser | undefined>;
  getAdvertiserByName(name: string): Promise<Advertiser | undefined>;
  getAdvertisers(): Promise<Advertiser[]>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  
  // Agency methods
  getAgency(id: number): Promise<Agency | undefined>;
  getAgencyByName(name: string): Promise<Agency | undefined>;
  getAgencies(filters?: { type?: string }): Promise<Agency[]>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  
  // Deal methods
  getDeal(id: number): Promise<Deal | undefined>;
  getDealByReference(referenceNumber: string): Promise<Deal | undefined>;
  // Phase 7B: Enhanced deal filtering with user access control
  getDeals(filters?: { 
    status?: string, 
    dealType?: string, 
    salesChannel?: string,
    createdBy?: number, // For role-based access
    assignedTo?: number 
  }): Promise<Deal[]>;
  createDeal(deal: InsertDeal, referenceNumber?: string): Promise<Deal>;
  updateDeal(id: number, dealData: Partial<InsertDeal>): Promise<Deal | undefined>;
  updateDealStatus(id: number, status: DealStatus, changedBy: string, comments?: string): Promise<Deal | undefined>;
  updateDealWithRevision(id: number, revisionData: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  
  // Phase 7A: Deal Status History methods
  getDealStatusHistory(dealId: number): Promise<DealStatusHistory[]>;
  createDealStatusHistory(statusHistory: InsertDealStatusHistory): Promise<DealStatusHistory>;
  
  // Phase 3: Deal Comments methods
  getDealComments(dealId: number): Promise<any[]>;
  createDealComment(commentData: any): Promise<any>;
  
  // Multi-Layered Approval System methods
  getDealApprovals(dealId: number): Promise<DealApproval[]>;
  createDealApproval(approval: InsertDealApproval): Promise<DealApproval>;
  updateDealApproval(id: number, approvalData: Partial<InsertDealApproval>): Promise<DealApproval | undefined>;
  
  getApprovalActions(approvalId: number): Promise<ApprovalAction[]>;
  createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction>;
  
  getApprovalDepartments(): Promise<ApprovalDepartment[]>;
  getApprovalDepartment(departmentName: DepartmentType): Promise<ApprovalDepartment | undefined>;
  createApprovalDepartment(department: InsertApprovalDepartment): Promise<ApprovalDepartment>;
  
  // Enhanced department assignment and approval queue methods
  determineRequiredDepartments(incentives: IncentiveValue[]): Promise<{
    departments: string[],
    reasons: Record<string, string[]>
  }>;
  getPendingApprovals(userRole?: string, userId?: number, userDepartment?: string): Promise<DealApproval[]>;
  
  // Enhanced approval workflow methods
  updateApprovalStatus(approvalId: number, status: string, reviewerNotes?: string, revisionReason?: string): Promise<DealApproval | undefined>;
  initiateEnhancedApprovalWorkflow(dealId: number, initiatedBy: number): Promise<{
    approvals: DealApproval[],
    workflow: any
  }>;
  
  // Deal tier methods
  getDealTiers(dealId: number): Promise<DealTier[]>;
  createDealTier(tier: InsertDealTier): Promise<DealTier>;
  updateDealTier(id: number, tier: Partial<InsertDealTier>): Promise<DealTier | undefined>;
  clearDealTiers(dealId: number): Promise<void>;
  
  // Deal scoping request methods
  getDealScopingRequest(id: number): Promise<DealScopingRequest | undefined>;
  getDealScopingRequests(filters?: { status?: string }): Promise<DealScopingRequest[]>;
  createDealScopingRequest(request: InsertDealScopingRequest): Promise<DealScopingRequest>;
  updateDealScopingRequestStatus(id: number, status: string): Promise<DealScopingRequest | undefined>;
  
  // Incentive value methods
  getIncentiveValues(dealId: number): Promise<IncentiveValue[]>;
  createIncentiveValue(incentive: InsertIncentiveValue): Promise<IncentiveValue>;
  updateIncentiveValue(id: number, incentive: Partial<InsertIncentiveValue>): Promise<IncentiveValue | undefined>;
  deleteIncentiveValue(id: number): Promise<boolean>;
  
  // Phase 7B: Updated stats methods for 9-status workflow with Close Rate
  getDealStats(): Promise<{
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    lostDeals: number;
    closeRate: number;
    scopingCount: number;
    submittedCount: number;
    underReviewCount: number;
    negotiatingCount: number;
    approvedCount: number;
    legalReviewCount: number;
    contractSentCount: number;
  }>;
}

// Interface for scheduled tasks
interface ScheduledTask {
  id: string;
  dealId: number;
  taskType: 'status_transition';
  fromStatus: DealStatus;
  toStatus: DealStatus;
  scheduledFor: Date;
  executed: boolean;
  createdAt: Date;
}

// Email notification placeholder - TODO: Implement proper email service
interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  type: 'deal_submitted' | 'status_changed' | 'approval_required';
  dealId: number;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private advertisers: Map<number, Advertiser>;
  private agencies: Map<number, Agency>;
  private deals: Map<number, Deal>;
  private dealTiers: Map<number, DealTier>;
  private dealScopingRequests: Map<number, DealScopingRequest>;
  private incentiveValues: Map<number, IncentiveValue>;
  private dealStatusHistories: Map<number, DealStatusHistory>; // Phase 7A
  private dealApprovals: Map<number, DealApproval>; // Multi-layered approval system
  private approvalActions: Map<number, ApprovalAction>;
  private approvalDepartments: Map<number, ApprovalDepartment>;
  
  // Scheduled task system for delayed status transitions
  private scheduledTasks: Map<string, ScheduledTask>;
  private taskTimer: NodeJS.Timeout | null = null;
  
  private userCurrentId: number;
  private advertiserCurrentId: number;
  private agencyCurrentId: number;
  private dealCurrentId: number;
  private dealTierCurrentId: number;
  private dealScopingRequestCurrentId: number;
  private incentiveValueCurrentId: number;
  private dealStatusHistoryCurrentId: number; // Phase 7A
  private dealApprovalCurrentId: number;
  private approvalActionCurrentId: number;
  private approvalDepartmentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.advertisers = new Map();
    this.agencies = new Map();
    this.deals = new Map();
    this.dealTiers = new Map();
    this.dealScopingRequests = new Map();
    this.incentiveValues = new Map();
    this.dealStatusHistories = new Map(); // Phase 7A
    this.dealApprovals = new Map();
    this.approvalActions = new Map();
    this.approvalDepartments = new Map();
    this.scheduledTasks = new Map();
    
    this.userCurrentId = 1;
    this.advertiserCurrentId = 1;
    this.agencyCurrentId = 1;
    this.dealCurrentId = 1;
    this.dealTierCurrentId = 1;
    this.dealScopingRequestCurrentId = 1;
    this.incentiveValueCurrentId = 1;
    this.dealStatusHistoryCurrentId = 1; // Phase 7A
    this.dealApprovalCurrentId = 1;
    this.approvalActionCurrentId = 1;
    this.approvalDepartmentCurrentId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
    
    // Initialize approval departments
    this.initApprovalDepartments();
    
    // Add demo data with older timestamps for testing insights
    this.addDemoStrategicInsightsData();
    
    // Initialize scheduled task system
    this.initializeTaskScheduler();
  }

  // Add demo data with older timestamps for Strategic Insights testing
  private addDemoStrategicInsightsData() {
    // Create timestamps that are old enough to trigger insights
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    
    // Update some deals with older timestamps to trigger different insights
    
    // Deal 6 (under_review) - make it stalled (5 days old)
    const deal6 = this.deals.get(6);
    if (deal6) {
      this.deals.set(6, { ...deal6, lastStatusChange: fiveDaysAgo });
    }
    
    // Deal 4 (under_review) - make it stalled (5 days old)  
    const deal4 = this.deals.get(4);
    if (deal4) {
      this.deals.set(4, { ...deal4, lastStatusChange: fiveDaysAgo });
    }
    
    // Deal 9 (negotiating) - make it stalled for seller (10 days old)
    const deal9 = this.deals.get(9);
    if (deal9) {
      this.deals.set(9, { ...deal9, lastStatusChange: tenDaysAgo });
    }
    
    // Deal 3 (approved) - make it stalled (5 days old)
    const deal3 = this.deals.get(3);
    if (deal3) {
      this.deals.set(3, { ...deal3, lastStatusChange: fiveDaysAgo });
    }

    // Add some test deals specifically for Finance department testing
    // Deal 1: Finance team should review - stalled for 4 days (will trigger strategic insight)
    const deal1 = this.deals.get(1);
    if (deal1 && deal1.status === 'submitted') {
      this.deals.set(1, { ...deal1, lastStatusChange: fourDaysAgo });
    }
    
    // Deal 2: Finance team should review - stalled for 5 days (will trigger strategic insight)  
    const deal2 = this.deals.get(2);
    if (deal2 && deal2.status === 'under_review') {
      this.deals.set(2, { ...deal2, lastStatusChange: fiveDaysAgo });
    }
  }

  // SCHEDULED TASK SYSTEM FOR DELAYED STATUS TRANSITIONS
  
  // Initialize the task scheduler that runs every minute
  private initializeTaskScheduler() {
    console.log("📅 TASK SCHEDULER: Initializing scheduled task system");
    
    // Run task processor every minute
    this.taskTimer = setInterval(() => {
      this.processScheduledTasks();
    }, 60000); // 60 seconds
    
    console.log("✅ TASK SCHEDULER: System initialized - checking tasks every 60 seconds");
  }
  
  // Process scheduled tasks that are due for execution
  private async processScheduledTasks() {
    const now = new Date();
    const dueTasks = Array.from(this.scheduledTasks.values())
      .filter(task => !task.executed && task.scheduledFor <= now);
    
    if (dueTasks.length === 0) return;
    
    console.log(`⏰ TASK PROCESSOR: Found ${dueTasks.length} tasks ready for execution`);
    
    for (const task of dueTasks) {
      try {
        await this.executeScheduledTask(task);
      } catch (error) {
        console.error(`❌ TASK EXECUTION FAILED: Task ${task.id}`, error);
      }
    }
  }
  
  // Execute a specific scheduled task
  private async executeScheduledTask(task: ScheduledTask) {
    if (task.taskType === 'status_transition') {
      const deal = this.deals.get(task.dealId);
      if (!deal) {
        console.error(`❌ TASK EXECUTION: Deal ${task.dealId} not found for task ${task.id}`);
        return;
      }
      
      // Only execute if deal is still in the expected status
      if (deal.status === task.fromStatus) {
        console.log(`🔄 AUTO STATUS TRANSITION: Deal ${task.dealId} ${task.fromStatus} → ${task.toStatus}`);
        
        // Send email notifications before status change (placeholder)
        await this.sendEmailNotifications(task.dealId, 'status_changed', task.toStatus);
        
        // Execute the status transition
        await this.updateDealStatus(
          task.dealId, 
          task.toStatus, 
          'system_scheduler',
          `Automatic transition from ${task.fromStatus} to ${task.toStatus} after 2-hour delay`
        );
        
        console.log(`✅ AUTO TRANSITION COMPLETE: Deal ${task.dealId} moved to ${task.toStatus}`);
      } else {
        console.log(`⏭️  TASK SKIPPED: Deal ${task.dealId} status changed from ${task.fromStatus} to ${deal.status}, skipping scheduled transition`);
      }
    }
    
    // Mark task as executed
    task.executed = true;
    this.scheduledTasks.set(task.id, task);
  }
  
  // Schedule a delayed status transition
  private scheduleStatusTransition(dealId: number, fromStatus: DealStatus, toStatus: DealStatus, delayHours: number = 2) {
    const taskId = `deal_${dealId}_${fromStatus}_to_${toStatus}_${Date.now()}`;
    const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);
    
    const task: ScheduledTask = {
      id: taskId,
      dealId,
      taskType: 'status_transition',
      fromStatus,
      toStatus,
      scheduledFor,
      executed: false,
      createdAt: new Date()
    };
    
    this.scheduledTasks.set(taskId, task);
    
    console.log(`📅 SCHEDULED TRANSITION: Deal ${dealId} will move from ${fromStatus} to ${toStatus} at ${scheduledFor.toISOString()}`);
    return taskId;
  }
  
  // Email notification placeholder - TODO: Implement proper email service
  private async sendEmailNotifications(dealId: number, type: EmailNotification['type'], newStatus?: DealStatus) {
    const deal = this.deals.get(dealId);
    if (!deal) return;
    
    console.log(`📧 EMAIL PLACEHOLDER: Would send ${type} notifications for Deal ${dealId} (${deal.dealName})`);
    
    if (type === 'deal_submitted') {
      // Notify seller, department reviewers, and approvers
      console.log(`   → Seller: Deal submitted successfully`);
      console.log(`   → Department Reviewers: New deal requires review`);
      console.log(`   → Approvers: New deal in pipeline`);
    } else if (type === 'status_changed' && newStatus) {
      console.log(`   → All stakeholders: Deal status changed to ${newStatus}`);
    }
    
    // TODO: Implement actual email service integration
    // - Use nodemailer or similar service
    // - Get recipient emails from deal.email and user roles
    // - Send formatted HTML emails with deal details
    // - Include links to deal pages and action buttons
  }
  
  // Initialize sample approval workflows for testing
  private initSampleApprovals() {
    console.log("🚀 INITIALIZING SAMPLE APPROVALS: Creating persistent approval workflows for testing");
    
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    
    // Deal 2: WPP Agency Partnership - OVERDUE APPROVALS for bottleneck testing
    const approvals = [
      {
        dealId: 2,
        approvalStage: 1,
        department: "finance" as any,
        requiredRole: "department_reviewer" as any,
        status: "pending" as any,
        priority: "normal" as any,
        dueDate: threeDaysAgo, // OVERDUE - should trigger bottleneck detection
      },
      {
        dealId: 2,
        approvalStage: 1,
        department: "trading" as any,
        requiredRole: "department_reviewer" as any,
        status: "pending" as any,
        priority: "normal" as any,
        dueDate: fiveDaysAgo, // SEVERELY OVERDUE - should trigger bottleneck detection
      },
      // Deal 6: Meta Q2 Campaign Scoping - has mixed approval states including revision_requested
      {
        dealId: 6,
        approvalStage: 1,
        department: "finance" as any,
        requiredRole: "department_reviewer" as any,
        status: "pending" as any,
        priority: "normal" as any,
        dueDate: oneDayFromNow, // Still on time
      },
      {
        dealId: 6,
        approvalStage: 1,
        department: "trading" as any,
        requiredRole: "department_reviewer" as any,
        status: "approved" as any,
        priority: "normal" as any,
        dueDate: oneDayFromNow,
      },
      {
        dealId: 6,
        approvalStage: 1,
        department: "creative" as any,
        requiredRole: "department_reviewer" as any,
        status: "revision_requested" as any, // BOTTLENECK - revision request blocks progress
        priority: "normal" as any,
        dueDate: oneDayFromNow,
      },
      
      // Deal 4: Droga5 Client Portfolio - Independent agency deal needs department review
      {
        dealId: 4,
        approvalStage: 1,
        department: "finance" as any,
        requiredRole: "department_reviewer" as any,
        status: "pending" as any,
        priority: "normal" as any,
        dueDate: oneDayFromNow, // Due tomorrow
      },
      {
        dealId: 4,
        approvalStage: 1,
        department: "trading" as any,
        requiredRole: "department_reviewer" as any,
        status: "pending" as any,
        priority: "normal" as any,
        dueDate: oneDayFromNow,
      }
    ];
    
    approvals.forEach(approval => {
      this.createDealApproval(approval);
      console.log(`📬 SAMPLE APPROVAL CREATED: Deal ${approval.dealId} - ${approval.department} department (${approval.status}${approval.status === 'pending' && new Date(approval.dueDate) < new Date() ? ' - OVERDUE' : ''})`);
    });
  }
  
  // Initialize with sample data for demo purposes
  private initSampleData() {
    // Phase 7B: Sample users with different roles
    const sampleUsers: InsertUser[] = [
      {
        username: "john_seller",
        password: "password123",
        email: "seller@company.com",
        role: "seller",
        firstName: "John",
        lastName: "Seller",
        department: null,
        isActive: true
      },
      {
        username: "sarah_approver",
        password: "password123", 
        email: "sarah.approver@company.com",
        role: "approver",
        firstName: "Sarah", 
        lastName: "Chen",
        department: null,
        isActive: true
      },
      {
        username: "mike_legal",
        password: "password123",
        email: "mike.legal@company.com", 
        role: "legal",
        firstName: "Mike",
        lastName: "Johnson", 
        department: null,
        isActive: true
      },
      {
        username: "lisa_seller",
        password: "password123",
        email: "lisa.seller@company.com",
        role: "seller",
        firstName: "Lisa",
        lastName: "Rodriguez",
        department: null,
        isActive: true
      },
      {
        username: "david_approver",
        password: "password123",
        email: "david.approver@company.com",
        role: "approver", 
        firstName: "David",
        lastName: "Wilson",
        department: null,
        isActive: true
      }
    ];

    // Add sample users
    sampleUsers.forEach(user => {
      this.createUser(user);
    });
    
    // Add sample department reviewers
    const departmentReviewers: InsertUser[] = [
      {
        username: "finance_reviewer",
        password: "password123",
        email: "finance.reviewer@company.com",
        role: "department_reviewer",
        firstName: "Emma",
        lastName: "Thompson",
        department: "finance",
        isActive: true
      },
      {
        username: "trading_reviewer", 
        password: "password123",
        email: "trading.reviewer@company.com",
        role: "department_reviewer",
        firstName: "Alex",
        lastName: "Chen",
        department: "trading",
        isActive: true
      },
      {
        username: "creative_reviewer",
        password: "password123", 
        email: "creative.reviewer@company.com",
        role: "department_reviewer",
        firstName: "Jordan",
        lastName: "Parker",
        department: "creative",
        isActive: true
      }
    ];
    
    departmentReviewers.forEach(user => {
      this.createUser(user);
    });
  }

  private initApprovalDepartments() {
    // Initialize the 6 departments for multi-layered approval
    const departments = [
      {
        department: "finance" as const,
        displayName: "Finance Team",
        description: "Reviews financial incentives and overall deal viability",
        contactEmail: "finance-team@company.com",
        incentiveTypes: ["financial_incentive", "payment_terms", "credit_terms", "budget_allocation"],
        isActive: true
      },
      {
        department: "trading" as const,
        displayName: "Trading Team", 
        description: "Reviews margin implications and trading viability",
        contactEmail: "trading-team@company.com",
        incentiveTypes: ["margin_optimization", "trading_terms", "volume_commitments"],
        isActive: true
      },
      {
        department: "creative" as const,
        displayName: "Creative Team",
        description: "Reviews creative and marketing incentives",
        contactEmail: "creative-team@company.com", 
        incentiveTypes: ["creative_incentive", "marketing_support", "brand_exposure", "co_marketing"],
        isActive: true
      },
      {
        department: "marketing" as const,
        displayName: "Marketing Team",
        description: "Reviews marketing strategy and promotional incentives",
        contactEmail: "marketing-team@company.com",
        incentiveTypes: ["promotional_support", "campaign_incentives", "media_benefits", "marketing_tools"],
        isActive: true
      },
      {
        department: "product" as const,
        displayName: "Product Team", 
        description: "Reviews product-related incentives and offerings",
        contactEmail: "product-team@company.com",
        incentiveTypes: ["product_incentive", "feature_access", "product_discount", "beta_access"],
        isActive: true
      },
      {
        department: "solutions" as const,
        displayName: "Solutions Team",
        description: "Reviews technical solutions and implementation incentives", 
        contactEmail: "solutions-team@company.com",
        incentiveTypes: ["technical_support", "implementation_services", "consulting_hours", "training_programs"],
        isActive: true
      }
    ];
    
    departments.forEach(dept => {
      this.createApprovalDepartment(dept);
    });

    // Sample advertisers
    const sampleAdvertisers: InsertAdvertiser[] = [
      { 
        name: "Coca-Cola", 
        previousYearRevenue: 2500000, 
        previousYearMargin: 0.185, // ✅ FIXED: 18.5% as decimal
        previousYearProfit: 462500, // revenue * margin
        previousYearIncentiveCost: 45000,
        previousYearClientValue: 157500, // incentive * 3.5x
        region: "south" 
      },
      { 
        name: "Pepsi", 
        previousYearRevenue: 2100000, 
        previousYearMargin: 0.178, // ✅ FIXED: 17.8% as decimal
        previousYearProfit: 373800,
        previousYearIncentiveCost: 38000,
        previousYearClientValue: 133000,
        region: "northeast" 
      },
      { 
        name: "General Motors", 
        previousYearRevenue: 4200000, 
        previousYearMargin: 0.123, // ✅ FIXED: 12.3% as decimal
        previousYearProfit: 516600,
        previousYearIncentiveCost: 65000,
        previousYearClientValue: 227500,
        region: "midwest" 
      },
      { 
        name: "Ford", 
        previousYearRevenue: 3700000, 
        previousYearMargin: 0.115, // ✅ FIXED: 11.5% as decimal
        previousYearProfit: 425500,
        previousYearIncentiveCost: 58000,
        previousYearClientValue: 203000,
        region: "midwest" 
      },
      { 
        name: "Nike", 
        previousYearRevenue: 1800000, 
        previousYearMargin: 0.224, // ✅ FIXED: 22.4% as decimal
        previousYearProfit: 403200,
        previousYearIncentiveCost: 35000,
        previousYearClientValue: 122500,
        region: "west" 
      },
      { 
        name: "Amazon", 
        previousYearRevenue: 5500000, 
        previousYearMargin: 0.257, // ✅ FIXED: 25.7% as decimal
        previousYearProfit: 1413500,
        previousYearIncentiveCost: 85000,
        previousYearClientValue: 297500,
        region: "west" 
      },
      { 
        name: "Microsoft", 
        previousYearRevenue: 4800000, 
        previousYearMargin: 0.312, // ✅ FIXED: 31.2% as decimal
        previousYearProfit: 1497600,
        previousYearIncentiveCost: 75000,
        previousYearClientValue: 262500,
        region: "west" 
      },
      { 
        name: "Target", 
        previousYearRevenue: 3200000, 
        previousYearMargin: 0.158, // ✅ FIXED: 15.8% as decimal
        previousYearProfit: 505600,
        previousYearIncentiveCost: 52000,
        previousYearClientValue: 182000,
        region: "midwest" 
      },
      { 
        name: "Meta", 
        previousYearRevenue: 1500000, 
        previousYearMargin: 0.280, // 28.0% as decimal
        previousYearProfit: 420000,
        previousYearIncentiveCost: 45000,
        previousYearClientValue: 150000,
        region: "west" 
      },
      { 
        name: "Tesla", 
        previousYearRevenue: 6000000, 
        previousYearMargin: 0.220, // 22.0% as decimal
        previousYearProfit: 1320000,
        previousYearIncentiveCost: 85000,
        previousYearClientValue: 300000,
        region: "west" 
      }
    ];
    
    // Sample agencies
    const sampleAgencies: InsertAgency[] = [
      { 
        name: "WPP", 
        previousYearRevenue: 8500000, 
        previousYearMargin: 0.285, // ✅ FIXED: 28.5% as decimal
        previousYearProfit: 2422500,
        previousYearIncentiveCost: 120000,
        previousYearClientValue: 420000,
        region: "northeast" 
      },
      { 
        name: "Omnicom", 
        previousYearRevenue: 7800000, 
        previousYearMargin: 0.272, // ✅ FIXED: 27.2% as decimal
        previousYearProfit: 2121600,
        previousYearIncentiveCost: 110000,
        previousYearClientValue: 385000,
        region: "northeast" 
      },
      { 
        name: "Publicis", 
        type: "holding_company", 
        previousYearRevenue: 7200000, 
        previousYearMargin: 0.268, // ✅ FIXED: 26.8% as decimal
        previousYearProfit: 1929600,
        previousYearIncentiveCost: 105000,
        previousYearClientValue: 367500,
        region: "midatlantic" 
      },
      { 
        name: "IPG", 
        type: "holding_company", 
        previousYearRevenue: 6900000, 
        previousYearMargin: 0.255, // ✅ FIXED: 25.5% as decimal
        previousYearProfit: 1759500,
        previousYearIncentiveCost: 95000,
        previousYearClientValue: 332500,
        region: "northeast" 
      },
      { 
        name: "Droga5", 
        type: "independent", 
        previousYearRevenue: 950000, 
        previousYearMargin: 0.328, // ✅ FIXED: 32.8% as decimal
        previousYearProfit: 311600,
        previousYearIncentiveCost: 28000,
        previousYearClientValue: 98000,
        region: "northeast" 
      },
      { 
        name: "72andSunny", 
        type: "independent", 
        previousYearRevenue: 620000, 
        previousYearMargin: 0.315, // ✅ FIXED: 31.5% as decimal
        previousYearProfit: 195300,
        previousYearIncentiveCost: 22000,
        previousYearClientValue: 77000,
        region: "west" 
      },
      { 
        name: "Wieden+Kennedy", 
        type: "independent", 
        previousYearRevenue: 780000, 
        previousYearMargin: 0.332, // ✅ FIXED: 33.2% as decimal
        previousYearProfit: 258960,
        previousYearIncentiveCost: 25000,
        previousYearClientValue: 87500,
        region: "west" 
      },
      { 
        name: "The Richards Group", 
        type: "independent", 
        previousYearRevenue: 510000, 
        previousYearMargin: 0.302, // ✅ FIXED: 30.2% as decimal
        previousYearProfit: 154020,
        previousYearIncentiveCost: 20000,
        previousYearClientValue: 70000,
        region: "south" 
      }
    ];
    
    // Add sample advertisers and agencies to storage
    sampleAdvertisers.forEach(advertiser => {
      this.createAdvertiser(advertiser);
    });
    
    sampleAgencies.forEach(agency => {
      this.createAgency(agency);
    });
    
    // Sample deals - removed referenceNumber as it's auto-generated
    const sampleDeals: InsertDeal[] = [
      {
        email: "seller@company.com", // Assign to demo seller
        dealName: "Coca-Cola Q1 2025 Campaign",
        dealType: "grow",
        businessSummary: "Comprehensive digital campaign focusing on growing Coca-Cola's market share in the Southern region, targeting younger demographics.",
        salesChannel: "client_direct",
        advertiserName: "Coca-Cola",
        region: "south",
        dealStructure: "tiered",
        termStartDate: "2025-01-01",
        termEndDate: "2025-12-31",
        // Financial data now handled through tier records
        priority: "high" as const,
        isRevision: false,
        status: "submitted" // Phase 7A compatible
      },
      {
        email: "seller@company.com", // Assign to demo seller
        dealName: "WPP Agency Partnership",
        dealType: "grow",
        businessSummary: "Strategic partnership with WPP to handle multiple clients under a unified agreement with volume discounts.",
        salesChannel: "holding_company",
        agencyName: "WPP",
        region: "northeast",
        dealStructure: "flat_commit",
        termStartDate: "2025-01-01",
        termEndDate: "2026-12-31",
        // Financial data now handled through tier records
        priority: "critical" as const,
        isRevision: false,
        status: "under_review" // Phase 7A: updated status
      },
      {
        dealName: "GM Custom Data Solution",
        dealType: "custom",
        businessSummary: "Custom data integration and analytics solution for GM's new vehicle lineup, designed to improve targeting precision.",
        salesChannel: "client_direct",
        advertiserName: "General Motors",
        region: "midwest",
        dealStructure: "flat_commit",
        termStartDate: "2025-03-01",
        termEndDate: "2026-02-28",
        // Financial data now handled through tier records
        priority: "high" as const,
        isRevision: false,
        status: "approved" // Phase 7A: updated status
      },
      {
        email: "seller@company.com", // Assign to demo seller
        dealName: "Droga5 Client Portfolio",
        dealType: "protect",
        businessSummary: "Retention-focused deal to maintain Droga5's existing client portfolio with minimal growth targets but stable margins.",
        salesChannel: "independent_agency",
        agencyName: "Droga5",
        region: "northeast",
        dealStructure: "tiered",
        termStartDate: "2025-02-15",
        termEndDate: "2025-12-31",
        // Financial data now handled through tier records
        priority: "medium" as const,
        isRevision: false,
        status: "under_review" // In review status with revision requests at approval level
      },
      {
        email: "seller@company.com", // Assign to demo seller
        dealName: "Nike Digital Transformation",
        dealType: "custom",
        businessSummary: "Comprehensive digital transformation project focused on Nike's online retail experience and personalization capabilities.",
        salesChannel: "client_direct",
        advertiserName: "Nike",
        region: "west",
        dealStructure: "tiered",
        termStartDate: "2025-04-01",
        termEndDate: "2027-03-31",
        // Financial data now handled through tier records
        priority: "high" as const,
        isRevision: false,
        status: "signed" // Phase 7A compatible
      },
      // Phase 7A: Additional deals to cover all 9 statuses
      {
        email: "seller@company.com", // Assign to demo seller  
        dealName: "Meta Q2 Campaign Scoping",
        dealType: "grow",
        businessSummary: "Initial scoping discussion for Meta's Q2 advertising campaign with focus on mobile-first approach.",
        salesChannel: "client_direct",
        advertiserName: "Meta",
        region: "west",
        dealStructure: "tiered",
        termStartDate: "2025-04-01",
        termEndDate: "2025-09-30",
        // Financial data now handled through tier records
        priority: "medium" as const,
        isRevision: false,
        status: "under_review" // Changed for better pipeline view
      },
      {
        dealName: "Amazon Legal Review Contract",
        dealType: "custom",
        businessSummary: "Enterprise-level data solution currently undergoing legal review before contract execution.",
        salesChannel: "client_direct",
        advertiserName: "Amazon",
        region: "west",
        dealStructure: "flat_commit",
        termStartDate: "2025-05-01",
        termEndDate: "2026-04-30",
        // Financial data now handled through tier records
        priority: "critical" as const,
        isRevision: false,
        status: "contract_drafting" // Phase 7A: contract_drafting status (formerly legal_review)
      },
      {
        dealName: "Disney Contract Sent",
        dealType: "protect",
        businessSummary: "Retention deal for Disney's existing portfolio with contract sent and awaiting signature.",
        salesChannel: "client_direct",
        advertiserName: "Disney",
        region: "west",
        dealStructure: "tiered",
        termStartDate: "2025-03-15",
        termEndDate: "2026-03-14",
        // Financial data now handled through tier records
        priority: "high" as const,
        isRevision: false,
        status: "client_review" // Phase 7A: client_review status (formerly contract_sent)
      },
      {
        email: "seller@company.com", // Assign to demo seller
        dealName: "Tesla Growth Opportunity",
        dealType: "grow",
        businessSummary: "High-value growth opportunity with strong potential, currently in negotiation phase.",
        salesChannel: "client_direct",
        advertiserName: "Tesla",
        region: "west",
        dealStructure: "flat_commit",
        termStartDate: "2025-02-01",
        termEndDate: "2025-12-31",
        // Financial data now handled through tier records
        priority: "critical" as const,
        isRevision: false,
        status: "negotiating" // Changed from lost to active deal
      },
      // Draft deal for testing draft editing flow
      {
        email: "seller@company.com",
        dealName: "Amazon Prime Video - Draft Campaign",
        dealType: "grow",
        businessSummary: "Exploring new partnership opportunities with Amazon Prime Video for streaming advertising placement. This is a draft deal being developed.",
        salesChannel: "client_direct",
        advertiserName: "Amazon",
        region: "west",
        dealStructure: "flat_commit",
        termStartDate: "2025-04-01",
        termEndDate: "2026-03-31",
        contractTermMonths: 12,
        // Financial data now handled through tier records
        priority: "medium" as const,
        isRevision: false,
        status: "draft"
      },
      // Scoping deal for testing scoping flow
      {
        email: "seller@company.com", 
        dealName: "Microsoft Azure - Scoping Request",
        dealType: "grow",
        businessSummary: "Initial scoping for expanding Microsoft Azure advertising partnership. Currently gathering requirements and exploring growth opportunities.",
        salesChannel: "client_direct",
        advertiserName: "Microsoft",
        region: "west", 
        dealStructure: "tiered",
        termStartDate: "2025-05-01",
        termEndDate: "2026-04-30",
        contractTermMonths: 12,
        // Financial data now handled through tier records
        priority: "high" as const,
        isRevision: false,
        status: "scoping"
      },
      // Lost deal for testing complete status spectrum
      {
        email: "seller@company.com",
        dealName: "Oracle Database Migration - Lost",
        dealType: "grow",
        businessSummary: "Oracle database migration project that was lost to competitor due to pricing.",
        salesChannel: "client_direct",
        advertiserName: "Oracle",
        region: "west",
        dealStructure: "flat_commit",
        termStartDate: "2025-03-01",
        termEndDate: "2026-02-28",
        contractTermMonths: 12,
        // Financial data now handled through tier records
        priority: "medium" as const,
        isRevision: false,
        status: "lost"
      }
    ];
    
    // Add the sample deals to storage
    sampleDeals.forEach(deal => {
      this.createDeal(deal);
    });
    
    // Add sample approval workflows for testing
    this.initSampleApprovals();
    
    // Add some older timestamps to test Strategic Insights
    this.addDemoStrategicInsightsData();
    
    // Update existing deals with flow intelligence for testing
    this.updateFlowIntelligenceForExistingDeals().catch(console.error);
    
    // Add sample tiers for tiered deals using proper schema structure
    const tiersByDealId = {
      1: [ // For "Coca-Cola Q1 2025 Campaign"
        {
          dealId: 1,
          tierNumber: 1,
          annualRevenue: 2500000,
          annualGrossMargin: 0.185,
          categoryName: "Financial",
          subCategoryName: "Base Tier",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 1,
          tierNumber: 2,
          annualRevenue: 3000000,
          annualGrossMargin: 0.205,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Volume Discount",
          incentiveValue: 45000, // 1.5% of $3M
          incentiveNotes: "1.5% volume rebate"
        },
        {
          dealId: 1,
          tierNumber: 3,
          annualRevenue: 3500000,
          annualGrossMargin: 0.210,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Volume Discount",
          incentiveValue: 70000, // 2% of $3.5M
          incentiveNotes: "2% volume rebate + premium support"
        },
        {
          dealId: 1,
          tierNumber: 4,
          annualRevenue: 4000000,
          annualGrossMargin: 0.220,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Growth Bonus",
          incentiveValue: 120000, // 3% of $4M
          incentiveNotes: "3% growth bonus + premium support + quarterly strategy sessions"
        }
      ],
      4: [ // For "Droga5 Client Portfolio"
        {
          dealId: 4,
          tierNumber: 1,
          annualRevenue: 950000,
          annualGrossMargin: 0.328,
          categoryName: "Financial",
          subCategoryName: "Base Tier",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 4,
          tierNumber: 2,
          annualRevenue: 1000000,
          annualGrossMargin: 0.330,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Volume Discount",
          incentiveValue: 10000, // 1% of $1M
          incentiveNotes: "1% volume rebate"
        },
        {
          dealId: 4,
          tierNumber: 3,
          annualRevenue: 1100000,
          annualGrossMargin: 0.335,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Volume Discount",
          incentiveValue: 16500, // 1.5% of $1.1M
          incentiveNotes: "1.5% volume rebate"
        },
        {
          dealId: 4,
          tierNumber: 4,
          annualRevenue: 1250000,
          annualGrossMargin: 0.340,
          categoryName: "Resources",
          subCategoryName: "Support Services",
          incentiveOption: "Priority Support",
          incentiveValue: 31250, // 2.5% of $1.25M
          incentiveNotes: "2.5% rebate + priority support"
        }
      ],
      5: [ // For "Nike Digital Transformation"
        {
          dealId: 5,
          tierNumber: 1,
          annualRevenue: 2000000,
          annualGrossMargin: 0.230,
          categoryName: "Financial",
          subCategoryName: "Base Tier",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 5,
          tierNumber: 2,
          annualRevenue: 2500000,
          annualGrossMargin: 0.255,
          categoryName: "Analytics",
          subCategoryName: "Data Services",
          incentiveOption: "Enhanced Analytics Package",
          incentiveValue: 50000, // 2% of $2.5M
          incentiveNotes: "2% value + enhanced analytics package"
        },
        {
          dealId: 5,
          tierNumber: 3,
          annualRevenue: 3000000,
          annualGrossMargin: 0.270,
          categoryName: "Analytics",
          subCategoryName: "Training Services",
          incentiveOption: "Quarterly Workshops",
          incentiveValue: 90000, // 3% of $3M
          incentiveNotes: "3% value + enhanced analytics + quarterly workshops"
        },
        {
          dealId: 5,
          tierNumber: 4,
          annualRevenue: 3500000,
          annualGrossMargin: 0.285,
          categoryName: "Marketing",
          subCategoryName: "Premium Services",
          incentiveOption: "Executive Reviews",
          incentiveValue: 157500, // 4.5% of $3.5M
          incentiveNotes: "4.5% value + all premium features + executive quarterly reviews"
        }
      ],
      2: [ // For "WPP Agency Partnership" (flat_commit)
        {
          dealId: 2,
          tierNumber: 1,
          annualRevenue: 9500000,
          annualGrossMargin: 0.302,
          categoryName: "Financial",
          subCategoryName: "Flat Commit",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Flat commit - unified agreement"
        }
      ],
      3: [ // For "GM Custom Data Solution" (flat_commit)
        {
          dealId: 3,
          tierNumber: 1,
          annualRevenue: 5000000,
          annualGrossMargin: 0.158,
          categoryName: "Financial",
          subCategoryName: "Flat Commit",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Flat commit - custom data solution"
        }
      ],
      6: [ // For "Meta Q2 Campaign Scoping" (tiered)
        {
          dealId: 6,
          tierNumber: 1,
          annualRevenue: 1200000,
          annualGrossMargin: 0.265,
          categoryName: "Financial",
          subCategoryName: "Base Tier",
          incentiveOption: "No Incentive",
          incentiveValue: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 6,
          tierNumber: 2,
          annualRevenue: 1500000,
          annualGrossMargin: 0.280,
          categoryName: "Financial",
          subCategoryName: "Discounts",
          incentiveOption: "Volume Discount",
          incentiveValue: 15000, // 1% of $1.5M
          incentiveNotes: "1% volume rebate"
        },
        {
          dealId: 6,
          tierNumber: 3,
          annualRevenue: 1800000,
          annualGrossMargin: 0.295,
          categoryName: "Resources",
          subCategoryName: "Support Services",
          incentiveOption: "Priority Support",
          incentiveValue: 27000, // 1.5% of $1.8M
          incentiveNotes: "1.5% rebate + priority support"
        }
      ]
    };
    
    // Add the sample tiers to storage
    Object.values(tiersByDealId).forEach(tiers => {
      tiers.forEach(tier => {
        this.createDealTier(tier);
      });
    });

    // Sample scoping requests for conversion testing
    const sampleScopingRequests: InsertDealScopingRequest[] = [
      {
        requestTitle: "Amazon Prime Video Expansion",
        dealType: "grow",
        salesChannel: "client_direct",
        region: "northeast",
        advertiserName: "Amazon Prime Video",
        dealStructure: "tiered",
        growthAmbition: 2500000,
        growthOpportunityMIQ: "Expand streaming analytics and audience insights",
        growthOpportunityClient: "Scale Prime Video advertising across new demographics",
        clientAsks: "Advanced audience segmentation and real-time performance optimization",
        termStartDate: "2025-03-01",
        termEndDate: "2026-02-28",
        contractTermMonths: 12,
        email: "partnerships@amazon.com",
        status: "scoping"
      },
      {
        requestTitle: "Netflix Growth Strategy", 
        dealType: "grow",
        salesChannel: "client_direct",
        region: "west",
        advertiserName: "Netflix",
        dealStructure: "flat_commit",
        growthAmbition: 1800000,
        growthOpportunityMIQ: "International market expansion analytics",
        growthOpportunityClient: "Global content performance insights",
        clientAsks: "Multi-market campaign optimization and competitive intelligence",
        termStartDate: "2025-04-01",
        termEndDate: "2026-03-31",
        contractTermMonths: 12,
        email: "growth@netflix.com",
        status: "scoping"
      },
      {
        requestTitle: "Disney+ Custom Analytics",
        dealType: "custom",
        salesChannel: "client_direct", 
        region: "west",
        advertiserName: "Disney+",
        dealStructure: "tiered",
        growthAmbition: 3200000,
        growthOpportunityMIQ: "Family audience insights and content optimization",
        growthOpportunityClient: "Premium analytics for streaming content strategy",
        clientAsks: "Custom dashboard for content performance and family viewing patterns",
        termStartDate: "2025-05-01",
        termEndDate: "2026-04-30", 
        contractTermMonths: 12,
        email: "analytics@disney.com",
        status: "scoping"
      }
    ];

    // Add sample scoping requests
    sampleScopingRequests.forEach(request => {
      this.createDealScopingRequest(request);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Phase 7B: Role-based user methods
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, role: role as any, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  // Advertiser methods
  async getAdvertiser(id: number): Promise<Advertiser | undefined> {
    return this.advertisers.get(id);
  }
  
  async getAdvertiserByName(name: string): Promise<Advertiser | undefined> {
    return Array.from(this.advertisers.values()).find(
      (advertiser) => advertiser.name === name,
    );
  }
  
  async getAdvertisers(): Promise<Advertiser[]> {
    return Array.from(this.advertisers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async createAdvertiser(insertAdvertiser: InsertAdvertiser): Promise<Advertiser> {
    const id = this.advertiserCurrentId++;
    const now = new Date();
    
    const advertiser: Advertiser = {
      ...insertAdvertiser,
      id,
      createdAt: now,
      updatedAt: now,
      region: insertAdvertiser.region || null,
      previousYearRevenue: insertAdvertiser.previousYearRevenue || null,
      previousYearMargin: insertAdvertiser.previousYearMargin || null,
    };
    
    this.advertisers.set(id, advertiser);
    return advertiser;
  }
  
  // Agency methods
  async getAgency(id: number): Promise<Agency | undefined> {
    return this.agencies.get(id);
  }
  
  async getAgencyByName(name: string): Promise<Agency | undefined> {
    return Array.from(this.agencies.values()).find(
      (agency) => agency.name === name,
    );
  }
  
  async getAgencies(filters?: { type?: string }): Promise<Agency[]> {
    let agencies = Array.from(this.agencies.values());
    
    if (filters && filters.type) {
      agencies = agencies.filter(agency => agency.type === filters.type);
    }
    
    return agencies.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const id = this.agencyCurrentId++;
    const now = new Date();
    
    const agency: Agency = {
      ...insertAgency,
      id,
      createdAt: now,
      updatedAt: now,
      region: insertAgency.region || null,
      previousYearRevenue: insertAgency.previousYearRevenue || null,
      previousYearMargin: insertAgency.previousYearMargin || null,
      type: insertAgency.type || "independent",
    };
    
    this.agencies.set(id, agency);
    return agency;
  }
  
  // Deal tier methods
  async getDealTiers(dealId: number): Promise<DealTier[]> {
    const tiers = Array.from(this.dealTiers.values())
      .filter(tier => tier.dealId === dealId)
      .sort((a, b) => a.tierNumber - b.tierNumber);
      
    return tiers;
  }
  
  async createDealTier(insertTier: InsertDealTier): Promise<DealTier> {
    const id = this.dealTierCurrentId++;
    const now = new Date();
    
    const tier: DealTier = {
      ...insertTier,
      id,
      createdAt: now,
      updatedAt: now,
      incentiveNotes: insertTier.incentiveNotes || null,
    };
    
    this.dealTiers.set(id, tier);
    return tier;
  }

  async updateDealTier(id: number, tierData: Partial<InsertDealTier>): Promise<DealTier | undefined> {
    const tier = this.dealTiers.get(id);
    if (!tier) return undefined;
    
    const now = new Date();
    const updatedTier: DealTier = {
      ...tier,
      ...tierData,
      id, // Preserve the original ID
      updatedAt: now,
    };
    
    this.dealTiers.set(id, updatedTier);
    return updatedTier;
  }

  async clearDealTiers(dealId: number): Promise<void> {
    // Remove all tiers for this deal
    for (const [tierId, tier] of this.dealTiers.entries()) {
      if (tier.dealId === dealId) {
        this.dealTiers.delete(tierId);
      }
    }
  }
  
  async updateDealTier(id: number, tierUpdate: Partial<InsertDealTier>): Promise<DealTier | undefined> {
    const tier = this.dealTiers.get(id);
    if (!tier) return undefined;
    
    const updatedTier: DealTier = {
      ...tier,
      ...tierUpdate,
      updatedAt: new Date(),
    };
    
    this.dealTiers.set(id, updatedTier);
    return updatedTier;
  }
  
  // Deal methods
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }
  
  async getDealByReference(referenceNumber: string): Promise<Deal | undefined> {
    return Array.from(this.deals.values()).find(
      (deal) => deal.referenceNumber === referenceNumber,
    );
  }
  
  async getDeals(filters?: { status?: string, dealType?: string, salesChannel?: string }): Promise<Deal[]> {
    let deals = Array.from(this.deals.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        deals = deals.filter(deal => deal.status === filters.status);
      }
      if (filters.dealType) {
        deals = deals.filter(deal => deal.dealType === filters.dealType);
      }
      if (filters.salesChannel) {
        deals = deals.filter(deal => deal.salesChannel === filters.salesChannel);
      }
    }
    
    // Sort by newest first (using id as proxy for creation date)
    return deals.sort((a, b) => b.id - a.id);
  }

  // Update existing deals with flow intelligence for proper testing
  private async updateFlowIntelligenceForExistingDeals(): Promise<void> {
    const now = new Date();
    
    for (const [id, deal] of this.deals) {
      // Use backend calculateFlowIntelligence method for consistency
      const flowIntelligence = await this.calculateFlowIntelligence(deal, deal.status, now);
      
      // Update the deal
      this.deals.set(id, {
        ...deal,
        flowIntelligence
      });
    }
    
    console.log("Flow intelligence updated for existing deals");
  }
  
  async createDeal(insertDeal: InsertDeal, referenceNumber?: string): Promise<Deal> {
    const id = this.dealCurrentId++;
    const now = new Date();
    
    // Use provided reference number or generate a new one
    const dealReferenceNumber = referenceNumber || 
      `DEAL-${now.getFullYear()}-${String(id).padStart(3, '0')}`;
    
    // Calculate contract term in months from ISO date strings
    const contractTerm = insertDeal.termStartDate && insertDeal.termEndDate 
      ? Math.round((new Date(insertDeal.termEndDate).getTime() - new Date(insertDeal.termStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      : null;

    // Calculate initial flow intelligence using comprehensive system
    const dealStatus = insertDeal.status || "submitted";
    // Use old calculation method for synchronous creation, will be updated by updateFlowIntelligenceForExistingDeals
    const flowIntelligence = this.calculateFlowIntelligence({ ...insertDeal, lastStatusChange: now } as Deal, dealStatus, now);

    // Create a new deal with the provided data and default values
    const deal: Deal = {
      ...insertDeal,
      id,
      status: dealStatus, // Phase 7A: Use provided status or default
      lastStatusChange: now, // Phase 7A: Track status change time
      priority: insertDeal.priority || "medium", // Phase 7A: Default priority
      flowIntelligence, // Phase 7A: Calculate flow intelligence
      createdAt: now,
      updatedAt: now,
      referenceNumber: dealReferenceNumber,
      contractTerm,
      email: insertDeal.email || null,
      previousYearRevenue: insertDeal.previousYearRevenue || null,
      previousYearMargin: insertDeal.previousYearMargin || null,
      region: insertDeal.region || null,
      advertiserName: insertDeal.advertiserName || null,
      agencyName: insertDeal.agencyName || null,
      businessSummary: insertDeal.businessSummary || null,
      termStartDate: insertDeal.termStartDate || null,
      termEndDate: insertDeal.termEndDate || null,
      // Financial data managed through tier records
    };
    
    this.deals.set(id, deal);
    
    // ENHANCED STATUS TRANSITION LOGIC
    // If deal is submitted, schedule automatic transition to under_review after 2 hours
    if (dealStatus === 'submitted') {
      console.log(`📬 DEAL SUBMITTED: Deal ${id} (${deal.dealName}) created with submitted status`);
      
      // Send immediate email notifications (placeholder)
      await this.sendEmailNotifications(id, 'deal_submitted');
      
      // Schedule automatic transition to under_review after 2 hours
      this.scheduleStatusTransition(id, 'submitted', 'under_review', 2);
      
      console.log(`⏰ AUTO-TRANSITION SCHEDULED: Deal ${id} will move to under_review in 2 hours`);
    }
    
    return deal;
  }

  async updateDeal(id: number, dealData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const now = new Date();
    
    // Update the deal with new data
    const updatedDeal: Deal = {
      ...deal,
      ...dealData,
      id, // Preserve the original ID
      updatedAt: now,
    };
    
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }
  
  // Phase 7A: Enhanced updateDealStatus with status history tracking and flow intelligence
  async updateDealStatus(id: number, status: DealStatus, changedBy: string, comments?: string): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const previousStatus = deal.status;
    const now = new Date();
    
    // Calculate flow intelligence based on new status and timing
    const flowIntelligence = this.calculateFlowIntelligence(deal, status, now);
    
    // Update the deal
    const updatedDeal: Deal = {
      ...deal,
      status,
      lastStatusChange: now,
      updatedAt: now,
      flowIntelligence,
    };
    
    this.deals.set(id, updatedDeal);
    
    // Create status history entry
    await this.createDealStatusHistory({
      dealId: id,
      status,
      previousStatus,
      changedBy,
      comments: comments || null,
    });
    
    // AUTOMATIC APPROVAL WORKFLOW TRIGGERING
    // When a deal moves to "under_review", automatically initiate approval workflow
    if (status === 'under_review' && previousStatus !== 'under_review') {
      try {
        console.log(`🔄 AUTO-TRIGGERING APPROVAL WORKFLOW: Deal ${id} moved to under_review`);
        
        // Get incentives to determine required departments
        const incentives = await this.getIncentiveValues(id);
        const { departments, reasons } = await this.determineRequiredDepartments(incentives);
        
        // Create Stage 1 department approvals
        for (const department of departments) {
          const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
          const departmentReasons = reasons[department] || [];
          
          await this.createDealApproval({
            dealId: id,
            approvalStage: 1,
            department: department as any,
            requiredRole: 'department_reviewer',
            status: 'pending',
            priority: 'normal',
            dueDate,
          });
          
          console.log(`📬 AUTO-CREATED APPROVAL: Deal ${id} - ${department} department (${departmentReasons.join(", ")})`);
        }
        
        console.log(`✅ APPROVAL WORKFLOW INITIATED: Deal ${id} has ${departments.length} department reviews assigned`);
      } catch (error) {
        console.error(`❌ FAILED TO INITIATE APPROVAL WORKFLOW for Deal ${id}:`, error);
        // Don't throw - deal status update should still succeed even if approval workflow fails
      }
    }
    
    return updatedDeal;
  }
  
  // TESTING METHOD: Create a deal with short delay for demo purposes
  async createTestDealWithShortDelay(insertDeal: InsertDeal): Promise<Deal> {
    const deal = await this.createDeal(insertDeal);
    
    // If submitted, override the 2-hour delay with 2-minute delay for testing
    if (deal.status === 'submitted') {
      // Cancel existing scheduled task
      const existingTasks = Array.from(this.scheduledTasks.values())
        .filter(task => task.dealId === deal.id && !task.executed);
      
      existingTasks.forEach(task => {
        task.executed = true; // Mark as executed to cancel
        this.scheduledTasks.set(task.id, task);
      });
      
      // Schedule new task with 2-minute delay for testing
      this.scheduleStatusTransition(deal.id, 'submitted', 'under_review', 2/60); // 2 minutes
      
      console.log(`🧪 TEST MODE: Deal ${deal.id} will auto-transition in 2 minutes instead of 2 hours`);
    }
    
    return deal;
  }

  // Phase 7A: Calculate flow intelligence based on deal timing and status
  private async calculateFlowIntelligence(deal: Deal, status: DealStatus, currentTime: Date): Promise<"on_track" | "needs_attention" | null> {
    const now = currentTime;
    const lastUpdate = deal.lastStatusChange ? new Date(deal.lastStatusChange) : new Date(deal.createdAt || now);
    const daysInStatus = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Terminal states
    if (['signed', 'lost', 'canceled', 'draft'].includes(status)) {
      return "on_track";
    }

    // ENHANCED APPROVAL SYSTEM INTEGRATION - Check approval bottlenecks first
    if (status === 'under_review') {
      const approvalBottlenecks = await this.detectApprovalBottlenecks(deal.id, now);
      if (approvalBottlenecks.hasBottlenecks) {
        return 'needs_attention';
      }
    }

    // BUSINESS RISK CRITERIA - Check for immediate attention
    
    // 1. Revision requested - always needs seller attention
    if (status === 'revision_requested') {
      return 'needs_attention';
    }

    // 2. Extended negotiations (>7 days) - business concern  
    if (status === 'negotiating' && daysInStatus > 7) {
      return 'needs_attention';
    }

    // 3. High revision count - quality/process concern
    if (deal.revisionCount && deal.revisionCount >= 2) {
      return 'needs_attention';
    }

    // 4. Priority escalation - critical/high priority deals stuck too long
    if ((deal.priority === 'critical' || deal.priority === 'high') && daysInStatus > 1) {
      return 'needs_attention';
    }

    // 5. Stalled submissions - submitted deals not moving to review
    if (status === 'submitted' && daysInStatus > 3) {
      return 'needs_attention';
    }

    // 6. Extended approvals - approved deals not moving to execution
    if (status === 'approved' && daysInStatus > 5) {
      return 'needs_attention';
    }

    // 7. Contract drafting delays - legal bottleneck detection
    if (status === 'contract_drafting' && daysInStatus > 4) {
      return 'needs_attention';
    }

    // 8. Client review timeout - external dependency management
    if (status === 'client_review' && daysInStatus > 7) {
      return 'needs_attention';
    }

    // 9. High-value deal monitoring - deals over threshold need special attention
    // Phase 3: Use tier data for deal value calculation (expected tier approach)
    const dealTiers = await this.getDealTiers(deal.id);
    const expectedTier = dealTiers.find(t => t.tierNumber === 2) || dealTiers[0]; // Tier 2 or first available
    const dealValue = expectedTier?.annualRevenue || deal.growthAmbition || 0;
    if (dealValue > 5000000 && daysInStatus > 2) {
      return 'needs_attention';
    }

    // TIMING THRESHOLDS - Standard flow intelligence  
    const thresholds: Record<string, number> = {
      submitted: 2,
      under_review: 3, 
      scoping: 3,
      negotiating: 4,
      approved: 2,
      contract_drafting: 3,
      client_review: 4
    };
    
    const threshold = thresholds[status];
    if (threshold && daysInStatus >= threshold) {
      return 'needs_attention';
    }
    
    return "on_track";
  }

  // APPROVAL BOTTLENECK DETECTION - Enhanced integration with approval states
  private async detectApprovalBottlenecks(dealId: number, currentTime: Date): Promise<{
    hasBottlenecks: boolean;
    overdueApprovals: DealApproval[];
    stalledDepartments: string[];
    bottleneckSeverity: 'low' | 'medium' | 'high';
  }> {
    const approvals = await this.getDealApprovals(dealId);
    const overdueApprovals: DealApproval[] = [];
    const stalledDepartments: string[] = [];
    
    // Check for overdue approvals
    for (const approval of approvals) {
      if (approval.status === 'pending' && approval.dueDate) {
        const dueDate = new Date(approval.dueDate);
        const daysOverdue = Math.floor((currentTime.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue > 0) {
          overdueApprovals.push(approval);
          if (approval.department) {
            stalledDepartments.push(approval.department);
          }
        }
      }
      
      // Check for revision requests blocking progress
      if (approval.status === 'revision_requested') {
        if (approval.department) {
          stalledDepartments.push(approval.department);
        }
      }
    }
    
    // Determine bottleneck severity
    let bottleneckSeverity: 'low' | 'medium' | 'high' = 'low';
    if (overdueApprovals.length >= 3 || stalledDepartments.length >= 2) {
      bottleneckSeverity = 'high';
    } else if (overdueApprovals.length >= 2 || stalledDepartments.length >= 1) {
      bottleneckSeverity = 'medium';
    }
    
    // Check for Stage 1 completion bottlenecks
    const stage1Approvals = approvals.filter(a => a.approvalStage === 1);
    const pendingStage1 = stage1Approvals.filter(a => a.status === 'pending');
    
    if (stage1Approvals.length > 0 && pendingStage1.length > 0) {
      // If more than half of Stage 1 departments are still pending after 2+ days
      const createdAt = stage1Approvals[0]?.createdAt ? new Date(stage1Approvals[0].createdAt) : currentTime;
      const daysSinceCreation = Math.floor((currentTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation >= 2 && pendingStage1.length >= Math.ceil(stage1Approvals.length / 2)) {
        bottleneckSeverity = bottleneckSeverity === 'low' ? 'medium' : 'high';
      }
    }
    
    const hasBottlenecks = overdueApprovals.length > 0 || stalledDepartments.length > 0;
    
    return {
      hasBottlenecks,
      overdueApprovals,
      stalledDepartments: [...new Set(stalledDepartments)], // Remove duplicates
      bottleneckSeverity
    };
  }

  async updateDealWithRevision(id: number, revisionData: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const now = new Date();
    
    // Update the deal with revision data
    const updatedDeal: Deal = {
      ...deal,
      ...revisionData,
      lastStatusChange: now,
      updatedAt: now,
    };
    
    this.deals.set(id, updatedDeal);
    
    // Create status history entry if status changed
    if (revisionData.status && revisionData.status !== deal.status) {
      await this.createDealStatusHistory({
        dealId: id,
        status: revisionData.status,
        previousStatus: deal.status,
        changedBy: "system", // Revision requests are system-generated
        comments: revisionData.revisionReason || "Revision requested",
      });
    }
    
    return updatedDeal;
  }
  
  // Phase 7A: Deal Status History methods
  async getDealStatusHistory(dealId: number): Promise<DealStatusHistory[]> {
    return Array.from(this.dealStatusHistories.values())
      .filter(history => history.dealId === dealId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }
  
  async createDealStatusHistory(insertStatusHistory: InsertDealStatusHistory): Promise<DealStatusHistory> {
    const id = this.dealStatusHistoryCurrentId++;
    const now = new Date();
    
    const statusHistory: DealStatusHistory = {
      ...insertStatusHistory,
      id,
      changedAt: now,
      comments: insertStatusHistory.comments || null,
      previousStatus: insertStatusHistory.previousStatus || null,
    };
    
    this.dealStatusHistories.set(id, statusHistory);
    return statusHistory;
  }
  
  // Deal scoping request methods
  async getDealScopingRequest(id: number): Promise<DealScopingRequest | undefined> {
    return this.dealScopingRequests.get(id);
  }
  
  async getDealScopingRequests(filters?: { status?: string }): Promise<DealScopingRequest[]> {
    let requests = Array.from(this.dealScopingRequests.values());
    
    // Apply filters if provided
    if (filters && filters.status) {
      requests = requests.filter(request => request.status === filters.status);
    }
    
    // Sort by newest first (using id as proxy for creation date)
    return requests.sort((a, b) => b.id - a.id);
  }
  
  async createDealScopingRequest(insertRequest: InsertDealScopingRequest): Promise<DealScopingRequest> {
    const id = this.dealScopingRequestCurrentId++;
    const now = new Date();
    
    // Create a new deal scoping request with the provided data and default values
    const request: DealScopingRequest = {
      ...insertRequest,
      id,
      status: "pending",
      email: insertRequest.email || null,
      advertiserName: insertRequest.advertiserName || null,
      agencyName: insertRequest.agencyName || null,
      clientAsks: insertRequest.clientAsks || null,
      description: insertRequest.description || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.dealScopingRequests.set(id, request);
    return request;
  }
  
  async updateDealScopingRequestStatus(id: number, status: string): Promise<DealScopingRequest | undefined> {
    const request = this.dealScopingRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: DealScopingRequest = {
      ...request,
      status,
      updatedAt: new Date(),
    };
    
    this.dealScopingRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Deal scoping request conversion methods
  async convertScopingRequestToDeal(scopingId: number): Promise<{ scopingRequest: DealScopingRequest; deal: Deal } | undefined> {
    const scopingRequest = this.dealScopingRequests.get(scopingId);
    if (!scopingRequest) return undefined;
    
    // If already converted, return the existing conversion
    if (scopingRequest.convertedDealId) {
      const existingDeal = this.deals.get(scopingRequest.convertedDealId);
      if (existingDeal) {
        return { scopingRequest, deal: existingDeal };
      }
    }
    
    // Map scoping request data to deal format with required fields
    const dealData = {
      email: scopingRequest.email,
      dealName: `Deal from ${scopingRequest.requestTitle}`,
      dealType: "grow" as const,
      salesChannel: scopingRequest.salesChannel as "holding_company" | "independent_agency" | "client_direct",
      region: "northeast" as const, // Default region, can be changed in submission form
      advertiserName: scopingRequest.advertiserName,
      agencyName: scopingRequest.agencyName,
      dealStructure: "tiered" as const,
      businessSummary: scopingRequest.description,
      growthOpportunityClient: scopingRequest.growthOpportunityClient,
      clientAsks: scopingRequest.clientAsks,
      growthAmbition: scopingRequest.growthAmbition,
      // Financial data managed through tier records
    };
    
    // Create the deal
    const deal = await this.createDeal(dealData);
    
    // Update scoping request with conversion info
    const now = new Date();
    const updatedScopingRequest: DealScopingRequest = {
      ...scopingRequest,
      convertedDealId: deal.id,
      convertedAt: now,
      status: "converted",
      updatedAt: now,
    };
    
    this.dealScopingRequests.set(scopingId, updatedScopingRequest);
    
    return { scopingRequest: updatedScopingRequest, deal };
  }
  
  // Incentive Value methods
  async getIncentiveValues(dealId: number): Promise<IncentiveValue[]> {
    return Array.from(this.incentiveValues.values())
      .filter(incentive => incentive.dealId === dealId)
      .sort((a, b) => a.id - b.id);
  }

  // Department Assignment Logic - NEW FUNCTION
  async determineRequiredDepartments(incentives: IncentiveValue[]): Promise<{
    departments: string[],
    reasons: Record<string, string[]>
  }> {
    // Finance & Trading always required for margin/profitability review
    const required = ["finance", "trading"];
    const reasons: Record<string, string[]> = {
      finance: ["margin_profitability_review"],
      trading: ["margin_profitability_review"]
    };

    // Map incentive categories to departments (using actual category IDs from schema)
    const incentiveMapping: Record<string, string> = {
      "financial": "finance",
      "resources": "finance", 
      "product-innovation": "creative",
      "technology": "product",
      "analytics": "solutions",
      "marketing": "marketing"
    };

    // Add departments based on incentive categories
    incentives.forEach(incentive => {
      const dept = incentiveMapping[incentive.category];
      if (dept && !required.includes(dept)) {
        required.push(dept);
        if (!reasons[dept]) reasons[dept] = [];
        reasons[dept].push(`${incentive.category}_incentive_review`);
      }
    });

    return { departments: required, reasons };
  }
  
  async createIncentiveValue(incentive: InsertIncentiveValue): Promise<IncentiveValue> {
    const id = this.incentiveValueCurrentId++;
    const now = new Date();
    
    const newIncentive: IncentiveValue = {
      ...incentive,
      id,
      value: incentive.value || null,
      notes: incentive.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.incentiveValues.set(id, newIncentive);
    return newIncentive;
  }
  
  async updateIncentiveValue(id: number, update: Partial<InsertIncentiveValue>): Promise<IncentiveValue | undefined> {
    const existing = this.incentiveValues.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updatedIncentive: IncentiveValue = {
      ...existing,
      ...update,
      updatedAt: new Date()
    };
    
    this.incentiveValues.set(id, updatedIncentive);
    return updatedIncentive;
  }
  
  async deleteIncentiveValue(id: number): Promise<boolean> {
    if (!this.incentiveValues.has(id)) {
      return false;
    }
    
    this.incentiveValues.delete(id);
    return true;
  }
  
  // Stats methods
  // Phase 7A: Updated getDealStats for 9-status workflow
  async getDealStats(): Promise<{
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    lostDeals: number;
    closeRate: number;
    scopingCount: number;
    submittedCount: number;
    underReviewCount: number;
    negotiatingCount: number;
    approvedCount: number;
    legalReviewCount: number;
    contractSentCount: number;
  }> {
    const deals = Array.from(this.deals.values());
    
    // Status counts
    const scopingCount = deals.filter(deal => deal.status === "scoping").length;
    const submittedCount = deals.filter(deal => deal.status === "submitted").length;
    const underReviewCount = deals.filter(deal => deal.status === "under_review").length;
    const negotiatingCount = deals.filter(deal => deal.status === "negotiating").length;
    const approvedCount = deals.filter(deal => deal.status === "approved").length;
    const contractDraftingCount = deals.filter(deal => deal.status === "contract_drafting").length;
    const clientReviewCount = deals.filter(deal => deal.status === "client_review").length;
    const completedDeals = deals.filter(deal => deal.status === "signed").length;
    const lostDeals = deals.filter(deal => deal.status === "lost").length;
    
    // Active deals = all statuses except signed and lost
    const activeDeals = scopingCount + submittedCount + underReviewCount + 
                       negotiatingCount + approvedCount + contractDraftingCount + clientReviewCount;
    
    const totalDeals = deals.length;
    
    // Close rate = signed / (signed + lost) * 100
    const totalConcludedDeals = completedDeals + lostDeals;
    const closeRate = totalConcludedDeals > 0 ? (completedDeals / totalConcludedDeals) * 100 : 0;
    
    return {
      totalDeals,
      activeDeals,
      completedDeals,
      lostDeals,
      closeRate: Math.round(closeRate * 10) / 10,
      scopingCount,
      submittedCount,
      underReviewCount,
      negotiatingCount,
      approvedCount,
      legalReviewCount: contractDraftingCount, // Backwards compatibility 
      contractSentCount: clientReviewCount // Backwards compatibility
    };
  }

  // Phase 3: Deal Comments methods
  private dealComments: any[] = [];

  async getDealComments(dealId: number): Promise<any[]> {
    return this.dealComments
      .filter(comment => comment.dealId === dealId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createDealComment(commentData: any): Promise<any> {
    const newComment = {
      id: Date.now() + Math.random(),
      ...commentData,
      createdAt: commentData.createdAt || new Date()
    };
    this.dealComments.push(newComment);
    return newComment;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const existingDeal = this.deals.get(id);
    if (!existingDeal) {
      return false;
    }
    
    // Remove deal and related data
    this.deals.delete(id);
    
    // Remove related tiers
    for (const [tierId, tier] of this.dealTiers.entries()) {
      if (tier.dealId === id) {
        this.dealTiers.delete(tierId);
      }
    }
    
    // Remove related comments
    if (this.dealComments) {
      this.dealComments = this.dealComments.filter(comment => comment.dealId !== id);
    }
    
    // Remove status history
    for (const [historyId, history] of this.dealStatusHistories.entries()) {
      if (history.dealId === id) {
        this.dealStatusHistories.delete(historyId);
      }
    }
    
    return true;
  }

  // Multi-Layered Approval System methods
  async getDealApprovals(dealId: number): Promise<DealApproval[]> {
    return Array.from(this.dealApprovals.values())
      .filter(approval => approval.dealId === dealId)
      .sort((a, b) => a.id - b.id);
  }

  getAllDealApprovals(): DealApproval[] {
    return Array.from(this.dealApprovals.values());
  }

  async createDealApproval(approval: InsertDealApproval): Promise<DealApproval> {
    const id = this.dealApprovalCurrentId++;
    const now = new Date();
    
    const newApproval: DealApproval = {
      ...approval,
      id,
      createdAt: now,
      completedAt: null,
      comments: approval.comments || null,
    };
    
    this.dealApprovals.set(id, newApproval);
    return newApproval;
  }

  async updateDealApproval(id: number, approvalData: Partial<InsertDealApproval>): Promise<DealApproval | undefined> {
    const approval = this.dealApprovals.get(id);
    if (!approval) return undefined;
    
    const updatedApproval: DealApproval = {
      ...approval,
      ...approvalData,
      completedAt: approvalData.status === 'approved' ? new Date() : null,
    };
    
    this.dealApprovals.set(id, updatedApproval);
    return updatedApproval;
  }

  async getApprovalActions(approvalId: number): Promise<ApprovalAction[]> {
    return Array.from(this.approvalActions.values())
      .filter(action => action.approvalId === approvalId)
      .sort((a, b) => a.id - b.id);
  }

  async createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction> {
    const id = this.approvalActionCurrentId++;
    const now = new Date();
    
    const newAction: ApprovalAction = {
      ...action,
      id,
      createdAt: now,
      comments: action.comments || null,
    };
    
    this.approvalActions.set(id, newAction);
    return newAction;
  }

  async getApprovalDepartments(): Promise<ApprovalDepartment[]> {
    return Array.from(this.approvalDepartments.values())
      .filter(dept => dept.isActive)
      .sort((a, b) => a.department.localeCompare(b.department));
  }

  async getApprovalDepartment(departmentName: DepartmentType): Promise<ApprovalDepartment | undefined> {
    return Array.from(this.approvalDepartments.values())
      .find(dept => dept.department === departmentName && dept.isActive);
  }

  async createApprovalDepartment(department: InsertApprovalDepartment): Promise<ApprovalDepartment> {
    const id = this.approvalDepartmentCurrentId++;
    const now = new Date();
    
    const newDepartment: ApprovalDepartment = {
      ...department,
      id,
      createdAt: now,
      updatedAt: now,
      contactEmail: department.contactEmail || null,
      defaultAssignee: department.defaultAssignee || null,
    };
    
    this.approvalDepartments.set(id, newDepartment);
    return newDepartment;
  }

  // Department-specific approval queue filtering
  async getPendingApprovals(userRole?: string, userId?: number, userDepartment?: string): Promise<DealApproval[]> {
    let approvals = Array.from(this.dealApprovals.values())
      .filter(approval => approval.status === 'pending');
    
    // Filter by department if specified
    if (userDepartment) {
      approvals = approvals.filter(approval => approval.department === userDepartment);
    }
    
    return approvals.sort((a, b) => a.id - b.id);
  }

  // Smart department assignment based on incentives + core departments
  async determineRequiredDepartments(incentives: IncentiveValue[]): Promise<{
    departments: string[],
    reasons: Record<string, string[]>
  }> {
    // Core departments that review ALL deals
    const coreDepartments = ["finance", "trading"];
    const reasons: Record<string, string[]> = {};
    
    // Initialize core departments
    coreDepartments.forEach(dept => {
      reasons[dept] = ["core_business_review"];
    });
    
    // Map incentives to specific departments
    const incentiveMapping: Record<string, string> = {
      "financial": "finance",
      "resources": "finance", 
      "product-innovation": "creative",
      "technology": "product",
      "analytics": "solutions",
      "marketing": "marketing"
    };
    
    // Add specialized departments based on incentives
    const specializedDepts = new Set<string>();
    incentives.forEach(incentive => {
      const dept = incentiveMapping[incentive.categoryId] || incentiveMapping[incentive.category];
      if (dept && dept !== "finance") { // Finance already included as core
        specializedDepts.add(dept);
        if (!reasons[dept]) reasons[dept] = [];
        reasons[dept].push(`${incentive.categoryId || incentive.category}_expertise`);
      }
    });
    
    // Combine core + specialized departments
    const allRequiredDepts = [...coreDepartments, ...Array.from(specializedDepts)];

    console.log(`📋 DEPARTMENT ROUTING: Required departments: ${allRequiredDepts.join(", ")}`);
    console.log(`   Core: ${coreDepartments.join(", ")}`);
    console.log(`   Specialized: ${Array.from(specializedDepts).join(", ") || "none"}`);

    return { 
      departments: allRequiredDepts, 
      reasons 
    };
  }

  // Simplified approval state logic - approval complexity managed through individual approval statuses

  // Update approval status with enhanced tracking
  async updateApprovalStatus(approvalId: number, status: string, reviewerNotes?: string, revisionReason?: string): Promise<DealApproval | undefined> {
    const approval = this.dealApprovals.get(approvalId);
    if (!approval) return undefined;
    
    const now = new Date();
    const updatedApproval: DealApproval = {
      ...approval,
      status,
      reviewerNotes: reviewerNotes || approval.reviewerNotes || null,
      revisionReason: revisionReason || approval.revisionReason || null,
      completedAt: ['approved'].includes(status) ? now : approval.completedAt
    };
    
    this.dealApprovals.set(approvalId, updatedApproval);
    
    // Create action history
    await this.createApprovalAction({
      approvalId,
      actionType: status === 'revision_requested' ? 'request_revision' : 'approve',
      performedBy: 1, // TODO: Get actual user ID
      comments: reviewerNotes || revisionReason
    });
    
    return updatedApproval;
  }

  // Enhanced approval workflow initiation for RELEVANT departments
  async initiateEnhancedApprovalWorkflow(dealId: number, initiatedBy: number): Promise<{
    approvals: DealApproval[],
    workflow: any
  }> {
    const deal = await this.getDeal(dealId);
    if (!deal) throw new Error("Deal not found");
    
    // Get incentives to determine which departments should review
    const incentives = await this.getIncentiveValues(dealId);
    const { departments, reasons } = await this.determineRequiredDepartments(incentives);
    
    const approvals: DealApproval[] = [];
    
    // Stage 1: Relevant departments review simultaneously
    for (const department of departments) {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      const departmentReasons = reasons[department] || [];
      
      const approval = await this.createDealApproval({
        dealId,
        approvalStage: 1,
        department: department as any,
        requiredRole: 'department_reviewer',
        status: 'pending',
        priority: 'normal',
        dueDate,
      });
      
      approvals.push(approval);
      
      console.log(`📬 APPROVAL ASSIGNMENT: Deal "${deal.dealName}" assigned for ${department} department review`);
      console.log(`   Reasons: ${departmentReasons.join(", ")}`);
      console.log(`   Stage: 1, Priority: normal, Due: ${dueDate}`);
    }
    
    // Stage 2: Business approval (will be created later when Stage 1 completes)
    
    return {
      approvals,
      workflow: {
        totalStages: 2,
        stage1Departments: departments.length,
        stage2Blocked: true,
        estimatedDuration: "5-10 business days"
      }
    };
  }

}

// Function to get the appropriate storage implementation based on environment
function getStorage(): IStorage {
  // Using in-memory storage exclusively as requested
  console.log("Using in-memory storage exclusively as requested");
  return new MemStorage();
}

export const storage = getStorage();
