import { 
  users, 
  deals,
  dealScopingRequests,
  advertisers,
  agencies,
  dealTiers,
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
  type InsertDealTier
} from "@shared/schema";
import { AirtableStorage } from "./airtableStorage";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  getDeals(filters?: { status?: string, dealType?: string, salesChannel?: string }): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDealStatus(id: number, status: string): Promise<Deal | undefined>;
  
  // Deal tier methods
  getDealTiers(dealId: number): Promise<DealTier[]>;
  createDealTier(tier: InsertDealTier): Promise<DealTier>;
  updateDealTier(id: number, tier: Partial<InsertDealTier>): Promise<DealTier | undefined>;
  
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
  private advertisers: Map<number, Advertiser>;
  private agencies: Map<number, Agency>;
  private deals: Map<number, Deal>;
  private dealTiers: Map<number, DealTier>;
  private dealScopingRequests: Map<number, DealScopingRequest>;
  
  private userCurrentId: number;
  private advertiserCurrentId: number;
  private agencyCurrentId: number;
  private dealCurrentId: number;
  private dealTierCurrentId: number;
  private dealScopingRequestCurrentId: number;

  constructor() {
    this.users = new Map();
    this.advertisers = new Map();
    this.agencies = new Map();
    this.deals = new Map();
    this.dealTiers = new Map();
    this.dealScopingRequests = new Map();
    
    this.userCurrentId = 1;
    this.advertiserCurrentId = 1;
    this.agencyCurrentId = 1;
    this.dealCurrentId = 1;
    this.dealTierCurrentId = 1;
    this.dealScopingRequestCurrentId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }
  
  // Initialize with sample data for demo purposes
  private initSampleData() {
    // Sample advertisers
    const sampleAdvertisers: InsertAdvertiser[] = [
      { 
        name: "Coca-Cola", 
        previousYearRevenue: 2500000, 
        previousYearMargin: 18.5, 
        region: "south" 
      },
      { 
        name: "Pepsi", 
        previousYearRevenue: 2100000, 
        previousYearMargin: 17.8, 
        region: "northeast" 
      },
      { 
        name: "General Motors", 
        previousYearRevenue: 4200000, 
        previousYearMargin: 12.3, 
        region: "midwest" 
      },
      { 
        name: "Ford", 
        previousYearRevenue: 3700000, 
        previousYearMargin: 11.5, 
        region: "midwest" 
      },
      { 
        name: "Nike", 
        previousYearRevenue: 1800000, 
        previousYearMargin: 22.4, 
        region: "west" 
      }
    ];
    
    // Sample agencies
    const sampleAgencies: InsertAgency[] = [
      { 
        name: "WPP", 
        type: "holding_company", 
        previousYearRevenue: 8500000, 
        previousYearMargin: 28.5, 
        region: "northeast" 
      },
      { 
        name: "Omnicom", 
        type: "holding_company", 
        previousYearRevenue: 7800000, 
        previousYearMargin: 27.2, 
        region: "northeast" 
      },
      { 
        name: "Droga5", 
        type: "independent", 
        previousYearRevenue: 950000, 
        previousYearMargin: 32.8, 
        region: "northeast" 
      },
      { 
        name: "72andSunny", 
        type: "independent", 
        previousYearRevenue: 620000, 
        previousYearMargin: 31.5, 
        region: "west" 
      },
      { 
        name: "The Richards Group", 
        type: "independent", 
        previousYearRevenue: 510000, 
        previousYearMargin: 30.2, 
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
    
    // Sample deals
    const sampleDeals: InsertDeal[] = [
      {
        dealName: "Coca-Cola Q1 2025 Campaign",
        dealType: "grow",
        businessSummary: "Comprehensive digital campaign focusing on growing Coca-Cola's market share in the Southern region, targeting younger demographics.",
        salesChannel: "client_direct",
        advertiserName: "Coca-Cola",
        region: "south",
        dealStructure: "tiered",
        termStartDate: new Date("2025-01-01"),
        termEndDate: new Date("2025-12-31"),
        annualRevenue: 3000000,
        annualGrossMargin: 20.5,
        previousYearRevenue: 2500000, 
        previousYearMargin: 18.5,
        hasTradeAMImplications: false,
        yearlyRevenueGrowthRate: 20,
        forecastedMargin: 20.5,
        yearlyMarginGrowthRate: 10.8,
        addedValueBenefitsCost: 150000,
        analyticsTier: "gold",
        requiresCustomMarketing: false,
        status: "submitted",
        referenceNumber: "DEAL-2025-001"
      },
      {
        dealName: "WPP Agency Partnership",
        dealType: "grow",
        businessSummary: "Strategic partnership with WPP to handle multiple clients under a unified agreement with volume discounts.",
        salesChannel: "holding_company",
        agencyName: "WPP",
        region: "northeast",
        dealStructure: "flat_commit",
        termStartDate: new Date("2025-01-01"),
        termEndDate: new Date("2026-12-31"),
        annualRevenue: 9500000,
        annualGrossMargin: 30.2,
        previousYearRevenue: 8500000,
        previousYearMargin: 28.5,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 11.8,
        forecastedMargin: 30.2,
        yearlyMarginGrowthRate: 5.9,
        addedValueBenefitsCost: 320000,
        analyticsTier: "platinum",
        requiresCustomMarketing: true,
        status: "in_review",
        referenceNumber: "DEAL-2025-002"
      },
      {
        dealName: "GM Custom Data Solution",
        dealType: "custom",
        businessSummary: "Custom data integration and analytics solution for GM's new vehicle lineup, designed to improve targeting precision.",
        salesChannel: "client_direct",
        advertiserName: "General Motors",
        region: "midwest",
        dealStructure: "flat_commit",
        termStartDate: new Date("2025-03-01"),
        termEndDate: new Date("2026-02-28"),
        annualRevenue: 5000000,
        annualGrossMargin: 15.8,
        previousYearRevenue: 4200000,
        previousYearMargin: 12.3,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 19,
        forecastedMargin: 15.8,
        yearlyMarginGrowthRate: 28.5,
        addedValueBenefitsCost: 450000,
        analyticsTier: "platinum",
        requiresCustomMarketing: true,
        status: "initial_approval",
        referenceNumber: "DEAL-2025-003"
      },
      {
        dealName: "Droga5 Client Portfolio",
        dealType: "protect",
        businessSummary: "Retention-focused deal to maintain Droga5's existing client portfolio with minimal growth targets but stable margins.",
        salesChannel: "independent_agency",
        agencyName: "Droga5",
        region: "northeast",
        dealStructure: "tiered",
        termStartDate: new Date("2025-02-15"),
        termEndDate: new Date("2025-12-31"),
        annualRevenue: 980000,
        annualGrossMargin: 32.8,
        previousYearRevenue: 950000,
        previousYearMargin: 32.8,
        hasTradeAMImplications: false,
        yearlyRevenueGrowthRate: 3.2,
        forecastedMargin: 32.8,
        yearlyMarginGrowthRate: 0,
        addedValueBenefitsCost: 50000,
        analyticsTier: "silver",
        requiresCustomMarketing: false,
        status: "client_feedback",
        referenceNumber: "DEAL-2025-004"
      },
      {
        dealName: "Nike Digital Transformation",
        dealType: "custom",
        businessSummary: "Comprehensive digital transformation project focused on Nike's online retail experience and personalization capabilities.",
        salesChannel: "client_direct",
        advertiserName: "Nike",
        region: "west",
        dealStructure: "tiered",
        termStartDate: new Date("2025-04-01"),
        termEndDate: new Date("2027-03-31"),
        annualRevenue: 2500000,
        annualGrossMargin: 25.5,
        previousYearRevenue: 1800000,
        previousYearMargin: 22.4,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 38.9,
        forecastedMargin: 25.5,
        yearlyMarginGrowthRate: 13.8,
        addedValueBenefitsCost: 275000,
        analyticsTier: "gold",
        requiresCustomMarketing: true,
        status: "signed",
        referenceNumber: "DEAL-2025-005"
      }
    ];
    
    // Add the sample deals to storage
    sampleDeals.forEach(deal => {
      this.createDeal(deal);
    });
    
    // Add sample tiers for tiered deals
    const tiersByDealId = {
      1: [ // For "Coca-Cola Q1 2025 Campaign"
        {
          dealId: 1,
          tierNumber: 1,
          annualRevenue: 2500000,
          annualGrossMargin: 18.5,
          incentivePercentage: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 1,
          tierNumber: 2,
          annualRevenue: 3000000,
          annualGrossMargin: 20.5,
          incentivePercentage: 1.5,
          incentiveNotes: "Tier 2 - 1.5% rebate"
        },
        {
          dealId: 1,
          tierNumber: 3,
          annualRevenue: 3500000,
          annualGrossMargin: 21.0,
          incentivePercentage: 2.0,
          incentiveNotes: "Tier 3 - 2% rebate + premium support"
        },
        {
          dealId: 1,
          tierNumber: 4,
          annualRevenue: 4000000,
          annualGrossMargin: 22.0,
          incentivePercentage: 3.0,
          incentiveNotes: "Tier 4 - 3% rebate + premium support + quarterly strategy sessions"
        }
      ],
      4: [ // For "Droga5 Client Portfolio"
        {
          dealId: 4,
          tierNumber: 1,
          annualRevenue: 950000,
          annualGrossMargin: 32.8,
          incentivePercentage: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 4,
          tierNumber: 2,
          annualRevenue: 1000000,
          annualGrossMargin: 33.0,
          incentivePercentage: 1.0,
          incentiveNotes: "Tier 2 - 1% rebate"
        },
        {
          dealId: 4,
          tierNumber: 3,
          annualRevenue: 1100000,
          annualGrossMargin: 33.5,
          incentivePercentage: 1.5,
          incentiveNotes: "Tier 3 - 1.5% rebate"
        },
        {
          dealId: 4,
          tierNumber: 4,
          annualRevenue: 1250000,
          annualGrossMargin: 34.0,
          incentivePercentage: 2.5,
          incentiveNotes: "Tier 4 - 2.5% rebate + priority support"
        }
      ],
      5: [ // For "Nike Digital Transformation"
        {
          dealId: 5,
          tierNumber: 1,
          annualRevenue: 2000000,
          annualGrossMargin: 23.0,
          incentivePercentage: 0,
          incentiveNotes: "Base tier - no incentives"
        },
        {
          dealId: 5,
          tierNumber: 2,
          annualRevenue: 2500000,
          annualGrossMargin: 25.5,
          incentivePercentage: 2.0,
          incentiveNotes: "Tier 2 - 2% rebate + enhanced analytics package"
        },
        {
          dealId: 5,
          tierNumber: 3,
          annualRevenue: 3000000,
          annualGrossMargin: 27.0,
          incentivePercentage: 3.0,
          incentiveNotes: "Tier 3 - 3% rebate + enhanced analytics + quarterly workshops"
        },
        {
          dealId: 5,
          tierNumber: 4,
          annualRevenue: 3500000,
          annualGrossMargin: 28.5,
          incentivePercentage: 4.5,
          incentiveNotes: "Tier 4 - 4.5% rebate + all premium features + executive quarterly reviews"
        }
      ]
    };
    
    // Add the sample tiers to storage
    Object.values(tiersByDealId).forEach(tiers => {
      tiers.forEach(tier => {
        this.createDealTier(tier);
      });
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
    };
    
    this.dealTiers.set(id, tier);
    return tier;
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
        
        // Advertiser methods - always use memory storage for now
        getAdvertiser: (id) => memStorage.getAdvertiser(id),
        getAdvertiserByName: (name) => memStorage.getAdvertiserByName(name),
        getAdvertisers: () => memStorage.getAdvertisers(),
        createAdvertiser: (advertiser) => memStorage.createAdvertiser(advertiser),
        
        // Agency methods - always use memory storage for now
        getAgency: (id) => memStorage.getAgency(id),
        getAgencyByName: (name) => memStorage.getAgencyByName(name),
        getAgencies: (filters) => memStorage.getAgencies(filters),
        createAgency: (agency) => memStorage.createAgency(agency),
        
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
        
        // Deal tier methods - always use memory storage for now
        getDealTiers: (dealId) => memStorage.getDealTiers(dealId),
        createDealTier: (tier) => memStorage.createDealTier(tier),
        updateDealTier: (id, tier) => memStorage.updateDealTier(id, tier),
        
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
