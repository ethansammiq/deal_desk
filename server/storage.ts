import { 
  users, 
  deals,
  dealScopingRequests,
  advertisers,
  agencies,
  dealTiers,
  incentiveValues,
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
  type InsertIncentiveValue
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
  createDeal(deal: InsertDeal, referenceNumber?: string): Promise<Deal>;
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
  
  // Incentive value methods
  getIncentiveValues(dealId: number): Promise<IncentiveValue[]>;
  createIncentiveValue(incentive: InsertIncentiveValue): Promise<IncentiveValue>;
  updateIncentiveValue(id: number, incentive: Partial<InsertIncentiveValue>): Promise<IncentiveValue | undefined>;
  deleteIncentiveValue(id: number): Promise<boolean>;
  
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
  private incentiveValues: Map<number, IncentiveValue>;
  
  private userCurrentId: number;
  private advertiserCurrentId: number;
  private agencyCurrentId: number;
  private dealCurrentId: number;
  private dealTierCurrentId: number;
  private dealScopingRequestCurrentId: number;
  private incentiveValueCurrentId: number;

  constructor() {
    this.users = new Map();
    this.advertisers = new Map();
    this.agencies = new Map();
    this.deals = new Map();
    this.dealTiers = new Map();
    this.dealScopingRequests = new Map();
    this.incentiveValues = new Map();
    
    this.userCurrentId = 1;
    this.advertiserCurrentId = 1;
    this.agencyCurrentId = 1;
    this.dealCurrentId = 1;
    this.dealTierCurrentId = 1;
    this.dealScopingRequestCurrentId = 1;
    this.incentiveValueCurrentId = 1;
    
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
      }
    ];
    
    // Sample agencies
    const sampleAgencies: InsertAgency[] = [
      { 
        name: "WPP", 
        type: "holding_company", 
        previousYearRevenue: 8500000, 
        previousYearMargin: 0.285, // ✅ FIXED: 28.5% as decimal
        previousYearProfit: 2422500,
        previousYearIncentiveCost: 120000,
        previousYearClientValue: 420000,
        region: "northeast" 
      },
      { 
        name: "Omnicom", 
        type: "holding_company", 
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
        dealName: "Coca-Cola Q1 2025 Campaign",
        dealType: "grow",
        businessSummary: "Comprehensive digital campaign focusing on growing Coca-Cola's market share in the Southern region, targeting younger demographics.",
        salesChannel: "client_direct",
        advertiserName: "Coca-Cola",
        region: "south",
        dealStructure: "tiered",
        termStartDate: "2025-01-01",
        termEndDate: "2025-12-31",
        annualRevenue: 3000000,
        annualGrossMargin: 20.5,
        hasTradeAMImplications: false,
        yearlyRevenueGrowthRate: 20,
        forecastedMargin: 20.5,
        yearlyMarginGrowthRate: 10.8,
        addedValueBenefitsCost: 150000,
        analyticsTier: "gold",
        requiresCustomMarketing: false,
        status: "submitted"
      },
      {
        dealName: "WPP Agency Partnership",
        dealType: "grow",
        businessSummary: "Strategic partnership with WPP to handle multiple clients under a unified agreement with volume discounts.",
        salesChannel: "holding_company",
        agencyName: "WPP",
        region: "northeast",
        dealStructure: "flat_commit",
        termStartDate: "2025-01-01",
        termEndDate: "2026-12-31",
        annualRevenue: 9500000,
        annualGrossMargin: 30.2,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 11.8,
        forecastedMargin: 30.2,
        yearlyMarginGrowthRate: 5.9,
        addedValueBenefitsCost: 320000,
        analyticsTier: "platinum",
        requiresCustomMarketing: true,
        status: "in_review"
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
        annualRevenue: 5000000,
        annualGrossMargin: 15.8,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 19,
        forecastedMargin: 15.8,
        yearlyMarginGrowthRate: 28.5,
        addedValueBenefitsCost: 450000,
        analyticsTier: "platinum",
        requiresCustomMarketing: true,
        status: "initial_approval"
      },
      {
        dealName: "Droga5 Client Portfolio",
        dealType: "protect",
        businessSummary: "Retention-focused deal to maintain Droga5's existing client portfolio with minimal growth targets but stable margins.",
        salesChannel: "independent_agency",
        agencyName: "Droga5",
        region: "northeast",
        dealStructure: "tiered",
        termStartDate: "2025-02-15",
        termEndDate: "2025-12-31",
        annualRevenue: 980000,
        annualGrossMargin: 32.8,
        hasTradeAMImplications: false,
        yearlyRevenueGrowthRate: 3.2,
        forecastedMargin: 32.8,
        yearlyMarginGrowthRate: 0,
        addedValueBenefitsCost: 50000,
        analyticsTier: "silver",
        requiresCustomMarketing: false,
        status: "client_feedback"
      },
      {
        dealName: "Nike Digital Transformation",
        dealType: "custom",
        businessSummary: "Comprehensive digital transformation project focused on Nike's online retail experience and personalization capabilities.",
        salesChannel: "client_direct",
        advertiserName: "Nike",
        region: "west",
        dealStructure: "tiered",
        termStartDate: "2025-04-01",
        termEndDate: "2027-03-31",
        annualRevenue: 2500000,
        annualGrossMargin: 25.5,
        hasTradeAMImplications: true,
        yearlyRevenueGrowthRate: 38.9,
        forecastedMargin: 25.5,
        yearlyMarginGrowthRate: 13.8,
        addedValueBenefitsCost: 275000,
        analyticsTier: "gold",
        requiresCustomMarketing: true,
        status: "signed"
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

    // Create a new deal with the provided data and default values
    const deal: Deal = {
      ...insertDeal,
      id,
      status: "submitted",
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
      annualRevenue: insertDeal.annualRevenue || null,
      annualGrossMargin: insertDeal.annualGrossMargin || null,
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
  
  // Incentive Value methods
  async getIncentiveValues(dealId: number): Promise<IncentiveValue[]> {
    return Array.from(this.incentiveValues.values())
      .filter(incentive => incentive.dealId === dealId)
      .sort((a, b) => a.id - b.id);
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
  async getDealStats(): Promise<{
    activeDeals: number;
    pendingApproval: number;
    completedDeals: number;
    successRate: number;
  }> {
    const deals = Array.from(this.deals.values());
    const activeDealStatuses = ["submitted", "in_review", "initial_approval", "client_feedback"];
    const pendingStatuses = ["submitted", "in_review"];
    const completedStatuses = ["signed", "approved"];
    const allCompletedStatuses = [...completedStatuses, "rejected"];
    
    const activeDeals = deals.filter(deal => activeDealStatuses.includes(deal.status)).length;
    const pendingApproval = deals.filter(deal => pendingStatuses.includes(deal.status)).length;
    const completedDeals = deals.filter(deal => completedStatuses.includes(deal.status)).length;
    const totalClosedDeals = deals.filter(deal => allCompletedStatuses.includes(deal.status)).length;
    
    // Calculate success rate (approved/signed vs all closed deals)
    const successRate = totalClosedDeals > 0 ? (completedDeals / totalClosedDeals) * 100 : 0;
    
    return {
      activeDeals,
      pendingApproval,
      completedDeals,
      successRate: Math.round(successRate * 10) / 10 // Round to 1 decimal place
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
