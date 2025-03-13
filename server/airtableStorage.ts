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
      
      this.base = Airtable.base(process.env.AIRTABLE_BASE_ID);
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
      // Load users
      const userRecords = await this.userTable.select().all();
      userRecords.forEach(record => {
        const fields = record.fields;
        const user: User = {
          id: fields.id as number,
          username: fields.username as string,
          password: fields.password as string
        };
        this.users.set(user.id, user);
        if (user.id >= this.userCurrentId) {
          this.userCurrentId = user.id + 1;
        }
      });
      
      // Load deals
      const dealRecords = await this.dealTable.select().all();
      dealRecords.forEach(record => {
        const fields = record.fields;
        const deal: Deal = {
          id: fields.id as number,
          referenceNumber: fields.referenceNumber as string,
          dealName: fields.dealName as string,
          dealType: fields.dealType as string,
          description: fields.description as string,
          clientName: fields.clientName as string,
          clientType: fields.clientType as string,
          industry: fields.industry as string,
          region: fields.region as string,
          department: fields.department as string,
          status: fields.status as string,
          totalValue: fields.totalValue as number,
          contractTerm: fields.contractTerm as number,
          discountPercentage: fields.discountPercentage as number,
          costPercentage: fields.costPercentage as number,
          expectedCloseDate: fields.expectedCloseDate as string
        };
        this.deals.set(deal.id, deal);
        if (deal.id >= this.dealCurrentId) {
          this.dealCurrentId = deal.id + 1;
        }
      });
      
      // Load support requests
      const supportRecords = await this.supportRequestTable.select().all();
      supportRecords.forEach(record => {
        const fields = record.fields;
        const request: SupportRequest = {
          id: fields.id as number,
          supportType: fields.supportType as string,
          requestTitle: fields.requestTitle as string,
          description: fields.description as string,
          status: fields.status as string,
          relatedDealId: fields.relatedDealId as number,
          priorityLevel: fields.priorityLevel as string,
          deadline: fields.deadline as string
        };
        this.supportRequests.set(request.id, request);
        if (request.id >= this.supportCurrentId) {
          this.supportCurrentId = request.id + 1;
        }
      });
      
      console.log('Loaded existing data from Airtable');
    } catch (error) {
      console.error('Error loading existing data from Airtable:', error);
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
      await this.userTable.create({
        id: id,
        username: user.username,
        password: user.password
      });
      
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
    
    const deal: Deal = {
      ...insertDeal,
      id,
      referenceNumber,
      status: 'pending'
    };
    
    try {
      // Add to Airtable
      await this.dealTable.create({
        id: id,
        referenceNumber: referenceNumber,
        dealName: deal.dealName,
        dealType: deal.dealType,
        description: deal.description,
        clientName: deal.clientName,
        clientType: deal.clientType,
        industry: deal.industry,
        region: deal.region,
        department: deal.department,
        status: deal.status,
        totalValue: deal.totalValue,
        contractTerm: deal.contractTerm,
        discountPercentage: deal.discountPercentage,
        costPercentage: deal.costPercentage,
        expectedCloseDate: deal.expectedCloseDate
      });
      
      // Add to local cache
      this.deals.set(id, deal);
      
      return deal;
    } catch (error) {
      console.error('Error creating deal in Airtable:', error);
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
      status
    };
    
    try {
      // Find record ID in Airtable by matching the id field
      const records = await this.dealTable.select({
        filterByFormula: `{id} = ${id}`
      }).all();
      
      if (records.length === 0) {
        throw new Error(`Deal with ID ${id} not found in Airtable`);
      }
      
      const recordId = records[0].id;
      
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
    
    const request: SupportRequest = {
      ...insertRequest,
      id,
      status: 'submitted'
    };
    
    try {
      // Add to Airtable
      await this.supportRequestTable.create({
        id: id,
        supportType: request.supportType,
        requestTitle: request.requestTitle,
        description: request.description,
        status: request.status,
        relatedDealId: request.relatedDealId,
        priorityLevel: request.priorityLevel,
        deadline: request.deadline
      });
      
      // Add to local cache
      this.supportRequests.set(id, request);
      
      return request;
    } catch (error) {
      console.error('Error creating support request in Airtable:', error);
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
      status
    };
    
    try {
      // Find record ID in Airtable by matching the id field
      const records = await this.supportRequestTable.select({
        filterByFormula: `{id} = ${id}`
      }).all();
      
      if (records.length === 0) {
        throw new Error(`Support request with ID ${id} not found in Airtable`);
      }
      
      const recordId = records[0].id;
      
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
    const activeDeals = deals.filter(deal => deal.status === 'active').length;
    const pendingApproval = deals.filter(deal => deal.status === 'pending').length;
    const completedDeals = deals.filter(deal => deal.status === 'completed').length;
    const rejectedDeals = deals.filter(deal => deal.status === 'rejected').length;
    
    const totalDecided = completedDeals + rejectedDeals;
    const successRate = totalDecided > 0 ? (completedDeals / totalDecided) * 100 : 0;
    
    return {
      activeDeals,
      pendingApproval,
      completedDeals,
      successRate
    };
  }
}