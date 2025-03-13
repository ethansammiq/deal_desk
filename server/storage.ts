import { 
  users, 
  deals, 
  supportRequests, 
  type User, 
  type InsertUser, 
  type Deal, 
  type InsertDeal,
  type SupportRequest,
  type InsertSupportRequest
} from "@shared/schema";
import { AirtableStorage } from "./airtableStorage";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Deal methods
  getDeal(id: number): Promise<Deal | undefined>;
  getDealByReference(referenceNumber: string): Promise<Deal | undefined>;
  getDeals(filters?: { status?: string }): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDealStatus(id: number, status: string): Promise<Deal | undefined>;
  
  // Support request methods
  getSupportRequest(id: number): Promise<SupportRequest | undefined>;
  getSupportRequests(): Promise<SupportRequest[]>;
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequestStatus(id: number, status: string): Promise<SupportRequest | undefined>;
  
  // Stats methods
  getDealStats(): Promise<{
    activeDeals: number;
    pendingApproval: number;
    completedDeals: number;
    successRate: number;
  }>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private deals: Map<number, Deal>;
  private supportRequests: Map<number, SupportRequest>;
  private userCurrentId: number;
  private dealCurrentId: number;
  private supportCurrentId: number;

  constructor() {
    this.users = new Map();
    this.deals = new Map();
    this.supportRequests = new Map();
    this.userCurrentId = 1;
    this.dealCurrentId = 1;
    this.supportCurrentId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }
  
  // Initialize with sample data for demo purposes
  private initSampleData() {
    const dealStatuses = ["pending", "approved", "rejected", "in_progress", "completed"];
    const dealTypes = ["new_business", "renewal", "upsell", "expansion", "special_project"];
    const clients = ["Acme Corporation", "Globex Industries", "Initech LLC", "Wayne Enterprises", "Stark Industries"];
    const departments = ["sales", "marketing", "operations", "it", "finance"];
    
    // Sample deals
    const sampleDeals: InsertDeal[] = [
      {
        dealName: "Enterprise SaaS Package",
        dealType: "new_business",
        description: "Comprehensive enterprise SaaS package including core platform licensing, implementation services, and premium support for 24 months.",
        department: "sales",
        expectedCloseDate: "2023-11-30",
        priority: "high",
        clientName: "Acme Corporation",
        clientType: "new",
        industry: "technology",
        region: "north_america",
        companySize: "enterprise",
        totalValue: 86500,
        contractTerm: 24,
        paymentTerms: "quarterly",
        discountPercentage: 10,
        renewalOption: "automatic",
        pricingNotes: "Includes 10% new customer discount. Annual review with option to upgrade to enterprise tier at current pricing.",
        status: "pending",
        referenceNumber: "DEAL-2023-089"
      },
      {
        dealName: "Annual Support Contract",
        dealType: "renewal",
        description: "Renewal of annual support contract with expanded service hours and dedicated technical account manager.",
        department: "operations",
        expectedCloseDate: "2023-12-15",
        priority: "medium",
        clientName: "Globex Industries",
        clientType: "existing",
        industry: "manufacturing",
        region: "europe",
        companySize: "large",
        totalValue: 45000,
        contractTerm: 12,
        paymentTerms: "annually",
        discountPercentage: 5,
        renewalOption: "manual",
        pricingNotes: "",
        status: "approved",
        referenceNumber: "DEAL-2023-088"
      },
      {
        dealName: "Data Migration Project",
        dealType: "special_project",
        description: "Migration of legacy systems to new cloud platform with data transformation and validation services.",
        department: "it",
        expectedCloseDate: "2023-12-05",
        priority: "high",
        clientName: "Initech LLC",
        clientType: "existing",
        industry: "finance",
        region: "north_america",
        companySize: "medium",
        totalValue: 125000,
        contractTerm: 6,
        paymentTerms: "monthly",
        discountPercentage: 0,
        renewalOption: "none",
        pricingNotes: "Fixed price project with milestone-based payments",
        status: "approved",
        referenceNumber: "DEAL-2023-087"
      },
      {
        dealName: "Cloud Infrastructure Upgrade",
        dealType: "upsell",
        description: "Expansion of cloud infrastructure with additional redundancy and performance optimization.",
        department: "it",
        expectedCloseDate: "2023-11-25",
        priority: "medium",
        clientName: "Wayne Enterprises",
        clientType: "existing",
        industry: "technology",
        region: "asia_pacific",
        companySize: "enterprise",
        totalValue: 250000,
        contractTerm: 36,
        paymentTerms: "quarterly",
        discountPercentage: 8,
        renewalOption: "automatic",
        pricingNotes: "",
        status: "in_progress",
        referenceNumber: "DEAL-2023-086"
      },
      {
        dealName: "Security Compliance Package",
        dealType: "new_business",
        description: "Comprehensive security audit, remediation, and compliance certification package.",
        department: "operations",
        expectedCloseDate: "2023-10-30",
        priority: "high",
        clientName: "Stark Industries",
        clientType: "new",
        industry: "technology",
        region: "north_america",
        companySize: "large",
        totalValue: 75800,
        contractTerm: 12,
        paymentTerms: "upfront",
        discountPercentage: 0,
        renewalOption: "none",
        pricingNotes: "",
        status: "rejected",
        referenceNumber: "DEAL-2023-085"
      }
    ];
    
    // Add the sample deals to storage
    sampleDeals.forEach(deal => {
      this.createDeal(deal);
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
  
  async getDeals(filters?: { status?: string }): Promise<Deal[]> {
    let deals = Array.from(this.deals.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        deals = deals.filter(deal => deal.status === filters.status);
      }
    }
    
    // Sort by newest first (using id as proxy for creation date)
    return deals.sort((a, b) => b.id - a.id);
  }
  
  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.dealCurrentId++;
    const now = new Date();
    
    // Create a new deal with the provided data and default values
    const deal: Deal = {
      ...insertDeal,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.deals.set(id, deal);
    return deal;
  }
  
  async updateDealStatus(id: number, status: string): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal: Deal = {
      ...deal,
      status,
      updatedAt: new Date(),
    };
    
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }
  
  // Support request methods
  async getSupportRequest(id: number): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }
  
  async getSupportRequests(): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values())
      .sort((a, b) => b.id - a.id);
  }
  
  async createSupportRequest(insertRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = this.supportCurrentId++;
    const now = new Date();
    
    const request: SupportRequest = {
      ...insertRequest,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.supportRequests.set(id, request);
    return request;
  }
  
  async updateSupportRequestStatus(id: number, status: string): Promise<SupportRequest | undefined> {
    const request = this.supportRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: SupportRequest = {
      ...request,
      status,
      updatedAt: new Date(),
    };
    
    this.supportRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Stats methods
  async getDealStats(): Promise<{
    activeDeals: number;
    pendingApproval: number;
    completedDeals: number;
    successRate: number;
  }> {
    const deals = Array.from(this.deals.values());
    
    const activeDeals = deals.filter(deal => 
      deal.status === "approved" || deal.status === "in_progress"
    ).length;
    
    const pendingApproval = deals.filter(deal => 
      deal.status === "pending"
    ).length;
    
    const completedDeals = deals.filter(deal => 
      deal.status === "completed"
    ).length;
    
    const successfulDeals = deals.filter(deal => 
      deal.status === "completed" || deal.status === "approved"
    ).length;
    
    const totalCompletedOrRejected = deals.filter(deal => 
      deal.status === "completed" || deal.status === "approved" || deal.status === "rejected"
    ).length;
    
    const successRate = totalCompletedOrRejected > 0 
      ? Math.round((successfulDeals / totalCompletedOrRejected) * 100) 
      : 0;
    
    return {
      activeDeals,
      pendingApproval,
      completedDeals,
      successRate
    };
  }
}

// Function to get the appropriate storage implementation based on environment
function getStorage(): IStorage {
  // If Airtable API credentials are provided, use Airtable storage
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    console.log("Using Airtable storage");
    try {
      return new AirtableStorage();
    } catch (error) {
      console.error("Failed to initialize Airtable storage:", error);
      console.log("Falling back to in-memory storage");
      return new MemStorage();
    }
  }
  
  // Otherwise, fall back to in-memory storage
  console.log("Using in-memory storage");
  return new MemStorage();
}

export const storage = getStorage();
