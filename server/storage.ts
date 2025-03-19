import { 
  users, 
  deals,
  dealScopingRequests,
  type User, 
  type InsertUser, 
  type Deal, 
  type InsertDeal,
  type DealScopingRequest,
  type InsertDealScopingRequest
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
  
  // Deal scoping request methods
  getDealScopingRequest(id: number): Promise<DealScopingRequest | undefined>;
  getDealScopingRequests(filters?: { status?: string }): Promise<DealScopingRequest[]>;
  createDealScopingRequest(request: InsertDealScopingRequest): Promise<DealScopingRequest>;
  updateDealScopingRequestStatus(id: number, status: string): Promise<DealScopingRequest | undefined>;
  
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
  private dealScopingRequests: Map<number, DealScopingRequest>;
  private userCurrentId: number;
  private dealCurrentId: number;
  private dealScopingRequestCurrentId: number;

  constructor() {
    this.users = new Map();
    this.deals = new Map();
    this.dealScopingRequests = new Map();
    this.userCurrentId = 1;
    this.dealCurrentId = 1;
    this.dealScopingRequestCurrentId = 1;
    
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
  // Create memory storage as either our main storage or a fallback
  const memStorage = new MemStorage();
  
  // If Airtable API credentials are provided, try to use Airtable storage
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      // Initialize Airtable storage
      const airtableStorage = new AirtableStorage();
      console.log("Successfully initialized Airtable storage");
      
      // Test Airtable permissions by attempting to access deal scoping requests
      // We'll create an async test but won't await it so initialization can continue
      (async () => {
        try {
          await airtableStorage.getDealScopingRequests();
          console.log("Airtable storage has permissions for deal scoping requests");
        } catch (error) {
          console.warn("Airtable doesn't have permissions for deal scoping requests, using hybrid storage");
        }
      })();
      
      // Create hybrid storage with graceful fallbacks
      return {
        // User methods - with fallback to memory if operations fail
        getUser: async (id) => {
          try {
            return await airtableStorage.getUser(id);
          } catch (err) {
            console.warn("Airtable user operation failed, using memory storage");
            return memStorage.getUser(id);
          }
        },
        getUserByUsername: async (username) => {
          try {
            return await airtableStorage.getUserByUsername(username);
          } catch (err) {
            console.warn("Airtable user operation failed, using memory storage");
            return memStorage.getUserByUsername(username);
          }
        },
        createUser: async (user) => {
          try {
            return await airtableStorage.createUser(user);
          } catch (err) {
            console.warn("Airtable user creation failed, using memory storage");
            return memStorage.createUser(user);
          }
        },
        
        // Deal methods - with fallback to memory if operations fail
        getDeal: async (id) => {
          try {
            return await airtableStorage.getDeal(id);
          } catch (err) {
            console.warn("Airtable deal operation failed, using memory storage");
            return memStorage.getDeal(id);
          }
        },
        getDealByReference: async (ref) => {
          try {
            return await airtableStorage.getDealByReference(ref);
          } catch (err) {
            console.warn("Airtable deal operation failed, using memory storage");
            return memStorage.getDealByReference(ref);
          }
        },
        getDeals: async (filters) => {
          try {
            return await airtableStorage.getDeals(filters);
          } catch (err) {
            console.warn("Airtable deal operation failed, using memory storage");
            return memStorage.getDeals(filters);
          }
        },
        createDeal: async (deal) => {
          try {
            return await airtableStorage.createDeal(deal);
          } catch (err) {
            console.warn("Airtable deal creation failed, using memory storage");
            return memStorage.createDeal(deal);
          }
        },
        updateDealStatus: async (id, status) => {
          try {
            return await airtableStorage.updateDealStatus(id, status);
          } catch (err) {
            console.warn("Airtable deal update failed, using memory storage");
            return memStorage.updateDealStatus(id, status);
          }
        },
        
        // Deal scoping request methods - always use memory storage as we know there are permission issues
        getDealScopingRequest: (id) => memStorage.getDealScopingRequest(id),
        getDealScopingRequests: (filters) => memStorage.getDealScopingRequests(filters),
        createDealScopingRequest: (request) => memStorage.createDealScopingRequest(request),
        updateDealScopingRequestStatus: (id, status) => memStorage.updateDealScopingRequestStatus(id, status),
        
        // Stats - with fallback to memory if operations fail
        getDealStats: async () => {
          try {
            return await airtableStorage.getDealStats();
          } catch (err) {
            console.warn("Airtable stats operation failed, using memory storage");
            return memStorage.getDealStats();
          }
        }
      };
    } catch (error) {
      console.error("Failed to initialize Airtable storage:", error);
      console.log("Falling back to in-memory storage for everything");
      return memStorage;
    }
  }
  
  // Otherwise, fall back to in-memory storage for everything
  console.log("Using in-memory storage");
  return memStorage;
}

export const storage = getStorage();
