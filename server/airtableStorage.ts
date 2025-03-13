import Airtable from 'airtable';
import { IStorage } from './storage';
import { 
  User, 
  InsertUser, 
  Deal, 
  InsertDeal, 
  SupportRequest, 
  InsertSupportRequest 
} from '@shared/schema';

export class AirtableStorage implements IStorage {
  private base: Airtable.Base;
  private userTable: Airtable.Table<any>;
  private dealTable: Airtable.Table<any>;
  private supportRequestTable: Airtable.Table<any>;
  
  // Local cache to reduce API calls
  private users: Map<number, User> = new Map();
  private deals: Map<number, Deal> = new Map();
  private supportRequests: Map<number, SupportRequest> = new Map();
  
  // Current IDs for new records
  private userCurrentId = 1;
  private dealCurrentId = 1;
  private supportCurrentId = 1;
  
  // Record ID maps to maintain relationship between our IDs and Airtable record IDs
  private userRecordIds: Map<number, string> = new Map();
  private dealRecordIds: Map<number, string> = new Map();
  private supportRequestRecordIds: Map<number, string> = new Map();
  
  constructor() {
    try {
      // Check if all required environment variables are set
      if (!process.env.AIRTABLE_API_KEY) {
        throw new Error('AIRTABLE_API_KEY environment variable is not set');
      }
      if (!process.env.AIRTABLE_BASE_ID) {
        throw new Error('AIRTABLE_BASE_ID environment variable is not set');
      }
      
      // Initialize Airtable
      Airtable.configure({
        apiKey: process.env.AIRTABLE_API_KEY
      });
      
      // Extract the base ID (app ID) from the provided Base ID
      const baseIdMatch = process.env.AIRTABLE_BASE_ID.match(/app[a-zA-Z0-9]+/);
      const baseId = baseIdMatch ? baseIdMatch[0] : process.env.AIRTABLE_BASE_ID;
      
      this.base = Airtable.base(baseId);
      this.userTable = this.base('Users');
      this.dealTable = this.base('Deals');
      this.supportRequestTable = this.base('SupportRequests');
      
      // Load existing data
      this.loadExistingData();
      
      console.log('Airtable storage initialized successfully');
    } catch (error) {
      console.error('Error initializing Airtable storage:', error);
      throw error; // Rethrow to allow the application to fall back to in-memory storage
    }
  }
  
  private async loadExistingData() {
    try {
      // Create sample data to initialize tables if they're empty
      await this.initializeTables();
      
      // Load users
      const userRecords = await this.userTable.select().all();
      userRecords.forEach(record => {
        const fields = record.fields;
        // Use the internal_id field, or generate one if not available
        const id = fields.internal_id ? Number(fields.internal_id) : this.userCurrentId++;
        
        const user: User = {
          id,
          username: fields.username ? String(fields.username) : 'user_' + id,
          password: fields.password ? String(fields.password) : 'password'
        };
        
        this.users.set(id, user);
        this.userRecordIds.set(id, record.id);
        
        if (id >= this.userCurrentId) {
          this.userCurrentId = id + 1;
        }
      });
      
      // Load deals
      const dealRecords = await this.dealTable.select().all();
      dealRecords.forEach(record => {
        const fields = record.fields;
        // Use the internal_id field, or generate one if not available
        const id = fields.internal_id ? Number(fields.internal_id) : this.dealCurrentId++;
        
        // Create a deal object with default values for missing fields
        const deal: Deal = {
          id,
          referenceNumber: fields.referenceNumber ? String(fields.referenceNumber) : `DEA-${String(id).padStart(4, '0')}`,
          dealName: fields.dealName ? String(fields.dealName) : 'Unnamed Deal',
          dealType: fields.dealType ? String(fields.dealType) : 'new_business',
          description: fields.description ? String(fields.description) : '',
          clientName: fields.clientName ? String(fields.clientName) : '',
          clientType: fields.clientType ? String(fields.clientType) : 'new',
          industry: fields.industry ? String(fields.industry) : '',
          region: fields.region ? String(fields.region) : '',
          department: fields.department ? String(fields.department) : '',
          status: fields.status ? String(fields.status) : 'pending',
          totalValue: fields.totalValue ? Number(fields.totalValue) : 0,
          contractTerm: fields.contractTerm ? Number(fields.contractTerm) : 12,
          discountPercentage: fields.discountPercentage ? Number(fields.discountPercentage) : 0,
          costPercentage: fields.costPercentage ? Number(fields.costPercentage) : 0,
          expectedCloseDate: fields.expectedCloseDate ? String(fields.expectedCloseDate) : '',
          priority: fields.priority ? String(fields.priority) : 'medium',
          companySize: fields.companySize ? String(fields.companySize) : 'medium',
          paymentTerms: fields.paymentTerms ? String(fields.paymentTerms) : 'monthly',
          incentivePercentage: fields.incentivePercentage ? Number(fields.incentivePercentage) : 0,
          previousYearValue: fields.previousYearValue ? Number(fields.previousYearValue) : 0,
          pricingNotes: fields.pricingNotes ? String(fields.pricingNotes) : '',
          renewalOption: fields.renewalOption ? String(fields.renewalOption) : 'manual',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.deals.set(id, deal);
        this.dealRecordIds.set(id, record.id);
        
        if (id >= this.dealCurrentId) {
          this.dealCurrentId = id + 1;
        }
      });
      
      // Load support requests
      const supportRecords = await this.supportRequestTable.select().all();
      supportRecords.forEach(record => {
        const fields = record.fields;
        // Use the internal_id field, or generate one if not available
        const id = fields.internal_id ? Number(fields.internal_id) : this.supportCurrentId++;
        
        const request: SupportRequest = {
          id,
          supportType: fields.supportType ? String(fields.supportType) : 'general',
          requestTitle: fields.requestTitle ? String(fields.requestTitle) : 'Support Request',
          description: fields.description ? String(fields.description) : '',
          status: fields.status ? String(fields.status) : 'submitted',
          relatedDealId: fields.relatedDealId ? Number(fields.relatedDealId) : null,
          priorityLevel: fields.priorityLevel ? String(fields.priorityLevel) : 'medium',
          deadline: fields.deadline ? String(fields.deadline) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.supportRequests.set(id, request);
        this.supportRequestRecordIds.set(id, record.id);
        
        if (id >= this.supportCurrentId) {
          this.supportCurrentId = id + 1;
        }
      });
      
      console.log('Loaded existing data from Airtable');
    } catch (error) {
      console.error('Error loading existing data from Airtable:', error);
    }
  }
  
  // Initialize tables with sample data if they're empty
  private async initializeTables() {
    try {
      // First, let's log the available fields for each table
      console.log('Inspecting Airtable tables structure...');
      
      // Check Users table
      const usersMeta = await this.userTable.select({
        maxRecords: 1
      }).firstPage();
      console.log('Users table fields:', usersMeta.length > 0 ? Object.keys(usersMeta[0].fields) : 'No records');
      
      // Check Deals table
      const dealsMeta = await this.dealTable.select({
        maxRecords: 1
      }).firstPage();
      console.log('Deals table fields:', dealsMeta.length > 0 ? Object.keys(dealsMeta[0].fields) : 'No records');
      
      // Check SupportRequests table
      const requestsMeta = await this.supportRequestTable.select({
        maxRecords: 1
      }).firstPage();
      console.log('SupportRequests table fields:', requestsMeta.length > 0 ? Object.keys(requestsMeta[0].fields) : 'No records');
      
      // Now let's initialize the tables if needed
      const users = await this.userTable.select().all();
      if (users.length === 0) {
        // Create an initial user with just the Name field
        await this.userTable.create({
          Name: 'Admin User'
        });
        console.log('Created initial user record');
      }
      
      const deals = await this.dealTable.select().all();
      if (deals.length === 0) {
        // Create an initial deal with just the Name field
        await this.dealTable.create({
          Name: 'Sample Deal'
        });
        console.log('Created initial deal record');
      }
      
      const supportRequests = await this.supportRequestTable.select().all();
      if (supportRequests.length === 0) {
        // Create an initial support request with just the Name field
        await this.supportRequestTable.create({
          Name: 'Initial Support Request'
        });
        console.log('Created initial support request record');
      }
    } catch (error) {
      console.error('Error initializing tables:', error);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    
    try {
      // Add to Airtable
      const record = await this.userTable.create({
        Name: user.username, // Airtable uses "Name" as the primary field
        username: user.username,
        password: user.password,
        internal_id: id
      });
      
      // Store the Airtable record ID
      this.userRecordIds.set(id, record.id);
      
      // Add to local cache
      this.users.set(id, user);
      
      return user;
    } catch (error) {
      console.error('Error creating user in Airtable:', error);
      throw error;
    }
  }
  
  // Deal methods
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }
  
  async getDealByReference(referenceNumber: string): Promise<Deal | undefined> {
    for (const deal of this.deals.values()) {
      if (deal.referenceNumber === referenceNumber) {
        return deal;
      }
    }
    return undefined;
  }
  
  async getDeals(filters?: { status?: string }): Promise<Deal[]> {
    const deals = Array.from(this.deals.values());
    
    if (filters?.status) {
      return deals.filter(deal => deal.status === filters.status);
    }
    
    return deals;
  }
  
  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.dealCurrentId++;
    const referenceNumber = `DEA-${String(id).padStart(4, '0')}`;
    const now = new Date();
    
    const deal: Deal = {
      ...insertDeal,
      id,
      referenceNumber,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // Create full record with all fields
      const record = await this.dealTable.create({
        Name: deal.dealName, // Airtable uses "Name" as the primary field
        internal_id: id,
        dealName: deal.dealName,
        dealType: deal.dealType,
        description: deal.description,
        department: deal.department,
        expectedCloseDate: deal.expectedCloseDate,
        priority: deal.priority,
        clientName: deal.clientName,
        clientType: deal.clientType,
        industry: deal.industry || '',
        region: deal.region || '',
        companySize: deal.companySize || 'medium',
        totalValue: deal.totalValue,
        contractTerm: deal.contractTerm,
        paymentTerms: deal.paymentTerms,
        discountPercentage: deal.discountPercentage,
        costPercentage: deal.costPercentage,
        incentivePercentage: deal.incentivePercentage,
        previousYearValue: deal.previousYearValue,
        renewalOption: deal.renewalOption,
        pricingNotes: deal.pricingNotes || '',
        status: deal.status,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        referenceNumber: referenceNumber
      });
      
      // Log success information
      console.log(`Successfully created deal "${deal.dealName}" in Airtable with all fields`);
      console.log(`Deal record ID: ${record.id}`);
      
      // Store the Airtable record ID
      this.dealRecordIds.set(id, record.id);
      
      // Add to local cache
      this.deals.set(id, deal);
      
      return deal;
    } catch (error) {
      console.error('Error creating deal in Airtable:', error);
      
      // If we get a field error, fall back to creating just the Name field
      // This allows the app to continue working even if the Airtable schema doesn't match
      if (error.message && error.message.includes('UNKNOWN_FIELD_NAME')) {
        console.log('Falling back to simple record creation (Name field only)');
        const record = await this.dealTable.create({
          Name: deal.dealName  // Airtable uses "Name" as the primary field
        });
        
        this.dealRecordIds.set(id, record.id);
        this.deals.set(id, deal);
        return deal;
      }
      throw error;
    }
  }
  
  async updateDealStatus(id: number, status: string): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    
    if (!deal) {
      return undefined;
    }
    
    const updatedDeal: Deal = {
      ...deal,
      status,
      updatedAt: new Date()
    };
    
    try {
      // Get the Airtable record ID
      const recordId = this.dealRecordIds.get(id);
      
      if (!recordId) {
        throw new Error(`Deal with ID ${id} not found in Airtable record map`);
      }
      
      // Update in Airtable
      await this.dealTable.update(recordId, {
        status: status
      });
      
      // Update local cache
      this.deals.set(id, updatedDeal);
      
      return updatedDeal;
    } catch (error) {
      console.error(`Error updating deal status in Airtable:`, error);
      throw error;
    }
  }
  
  // Support request methods
  async getSupportRequest(id: number): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }
  
  async getSupportRequests(): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values());
  }
  
  async createSupportRequest(insertRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = this.supportCurrentId++;
    const now = new Date();
    
    const request: SupportRequest = {
      ...insertRequest,
      id,
      status: 'submitted',
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // Create full record with all fields
      const record = await this.supportRequestTable.create({
        Name: request.requestTitle, // Airtable uses "Name" as the primary field
        internal_id: id,
        supportType: request.supportType,
        requestTitle: request.requestTitle,
        description: request.description,
        relatedDealId: request.relatedDealId || null,
        priorityLevel: request.priorityLevel || 'medium',
        deadline: request.deadline || '',
        status: request.status,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      
      // Log success information
      console.log(`Successfully created support request "${request.requestTitle}" in Airtable with all fields`);
      console.log(`Support request record ID: ${record.id}`);
      
      // Store the Airtable record ID
      this.supportRequestRecordIds.set(id, record.id);
      
      // Add to local cache
      this.supportRequests.set(id, request);
      
      return request;
    } catch (error) {
      console.error('Error creating support request in Airtable:', error);
      
      // If we get a field error, fall back to creating just the Name field
      // This allows the app to continue working even if the Airtable schema doesn't match
      if (error.message && error.message.includes('UNKNOWN_FIELD_NAME')) {
        console.log('Falling back to simple record creation (Name field only)');
        const record = await this.supportRequestTable.create({
          Name: request.requestTitle  // Airtable uses "Name" as the primary field
        });
        
        this.supportRequestRecordIds.set(id, record.id);
        this.supportRequests.set(id, request);
        return request;
      }
      throw error;
    }
  }
  
  async updateSupportRequestStatus(id: number, status: string): Promise<SupportRequest | undefined> {
    const request = this.supportRequests.get(id);
    
    if (!request) {
      return undefined;
    }
    
    const updatedRequest: SupportRequest = {
      ...request,
      status,
      updatedAt: new Date()
    };
    
    try {
      // Get the Airtable record ID
      const recordId = this.supportRequestRecordIds.get(id);
      
      if (!recordId) {
        throw new Error(`Support request with ID ${id} not found in Airtable record map`);
      }
      
      // Update in Airtable
      await this.supportRequestTable.update(recordId, {
        status: status
      });
      
      // Update local cache
      this.supportRequests.set(id, updatedRequest);
      
      return updatedRequest;
    } catch (error) {
      console.error(`Error updating support request status in Airtable:`, error);
      throw error;
    }
  }
  
  // Stats methods
  async getDealStats(): Promise<{
    activeDeals: number;
    pendingApproval: number;
    completedDeals: number;
    successRate: number;
  }> {
    const deals = Array.from(this.deals.values());
    const activeDeals = deals.filter(deal => deal.status === 'active' || deal.status === 'approved' || deal.status === 'in_progress').length;
    const pendingApproval = deals.filter(deal => deal.status === 'pending').length;
    const completedDeals = deals.filter(deal => deal.status === 'completed').length;
    const rejectedDeals = deals.filter(deal => deal.status === 'rejected').length;
    
    const totalDecided = completedDeals + rejectedDeals;
    const successRate = totalDecided > 0 ? Math.round((completedDeals / totalDecided) * 100) : 0;
    
    return {
      activeDeals,
      pendingApproval,
      completedDeals,
      successRate
    };
  }
}