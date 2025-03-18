import Airtable from 'airtable';
import { IStorage } from './storage';
import { 
  User, 
  InsertUser, 
  Deal, 
  InsertDeal
} from '@shared/schema';

export class AirtableStorage implements IStorage {
  private base: Airtable.Base;
  private userTable: Airtable.Table<any>;
  private dealTable: Airtable.Table<any>;
  
  // Local cache to reduce API calls
  private users: Map<number, User> = new Map();
  private deals: Map<number, Deal> = new Map();
  
  // Current IDs for new records
  private userCurrentId = 1;
  private dealCurrentId = 1;
  
  // Record ID maps to maintain relationship between our IDs and Airtable record IDs
  private userRecordIds: Map<number, string> = new Map();
  private dealRecordIds: Map<number, string> = new Map();
  
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
      
      // Support requests have been removed as per user request
      
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
      
      // Support requests table has been removed as per user request
      
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
      // Create a record with the primary "Name" field and any other fields that might exist
      // This approach is compatible with any Airtable schema
      const recordData: any = {
        Name: deal.dealName // Airtable uses "Name" as the primary field
      };
      
      // Get existing field names for this table
      const tableFields = await this.getDealTableFields();
      console.log('Available deal fields in Airtable:', tableFields);
      
      // Map our fields to Airtable fields if they exist
      if (tableFields.includes('dealName')) recordData.dealName = deal.dealName;
      if (tableFields.includes('dealType')) recordData.dealType = deal.dealType;
      if (tableFields.includes('description')) recordData.description = deal.description;
      if (tableFields.includes('department')) recordData.department = deal.department;
      if (tableFields.includes('expectedCloseDate')) recordData.expectedCloseDate = deal.expectedCloseDate;
      if (tableFields.includes('priority')) recordData.priority = deal.priority;
      if (tableFields.includes('clientName')) recordData.clientName = deal.clientName;
      if (tableFields.includes('clientType')) recordData.clientType = deal.clientType;
      if (tableFields.includes('industry')) recordData.industry = deal.industry || '';
      if (tableFields.includes('region')) recordData.region = deal.region || '';
      if (tableFields.includes('companySize')) recordData.companySize = deal.companySize || 'medium';
      if (tableFields.includes('totalValue')) recordData.totalValue = deal.totalValue;
      if (tableFields.includes('contractTerm')) recordData.contractTerm = deal.contractTerm;
      if (tableFields.includes('paymentTerms')) recordData.paymentTerms = deal.paymentTerms;
      if (tableFields.includes('discountPercentage')) recordData.discountPercentage = deal.discountPercentage;
      if (tableFields.includes('costPercentage')) recordData.costPercentage = deal.costPercentage;
      if (tableFields.includes('incentivePercentage')) recordData.incentivePercentage = deal.incentivePercentage;
      if (tableFields.includes('previousYearValue')) recordData.previousYearValue = deal.previousYearValue;
      if (tableFields.includes('renewalOption')) recordData.renewalOption = deal.renewalOption;
      if (tableFields.includes('pricingNotes')) recordData.pricingNotes = deal.pricingNotes || '';
      if (tableFields.includes('status')) recordData.status = deal.status;
      if (tableFields.includes('referenceNumber')) recordData.referenceNumber = referenceNumber;
      
      // New custom fields
      if (tableFields.includes('customField1')) recordData.customField1 = deal.customField1 || '';
      if (tableFields.includes('customField2')) recordData.customField2 = deal.customField2 || '';
      
      // Create the record in Airtable
      const record = await this.dealTable.create(recordData);
      
      // Log success information
      console.log(`Successfully created deal "${deal.dealName}" in Airtable`);
      console.log(`Deal record ID: ${record.id}`);
      
      // Store the Airtable record ID
      this.dealRecordIds.set(id, record.id);
      
      // Add to local cache
      this.deals.set(id, deal);
      
      return deal;
    } catch (error) {
      console.error('Error creating deal in Airtable:', error);
      
      // If we still get an error, fall back to creating just the Name field
      if (error.message && (error.message.includes('UNKNOWN_FIELD_NAME') || error.message.includes('NOT_FOUND'))) {
        console.log('Falling back to simple record creation (Name field only)');
        try {
          const record = await this.dealTable.create({
            Name: deal.dealName  // Airtable uses "Name" as the primary field
          });
          
          this.dealRecordIds.set(id, record.id);
          this.deals.set(id, deal);
          return deal;
        } catch (fallbackError) {
          console.error('Error in fallback creation:', fallbackError);
          // Even if the fallback fails, we still want to keep the deal in our local cache
          this.deals.set(id, deal);
          return deal;
        }
      }
      
      // Even if Airtable storage fails, keep the deal in our local cache
      this.deals.set(id, deal);
      return deal;
    }
  }
  
  // Helper method to get available fields for the Deals table
  private async getDealTableFields(): Promise<string[]> {
    try {
      const records = await this.dealTable.select({
        maxRecords: 1
      }).firstPage();
      
      if (records.length > 0) {
        return Object.keys(records[0].fields);
      }
      return ['Name']; // Default if no records exist
    } catch (error) {
      console.error('Error getting deal table fields:', error);
      return ['Name']; // Default on error
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
      
      // Get existing field names for this table
      const tableFields = await this.getDealTableFields();
      console.log('Available deal fields in Airtable for status update:', tableFields);
      
      // Create update data based on what fields exist
      const updateData: any = {};
      
      // If the status field exists, update it
      if (tableFields.includes('status')) {
        updateData.status = status;
      } else if (tableFields.includes('Status')) {
        // Airtable sometimes uses capitalized field names
        updateData.Status = status;
      } else {
        // Try to update the Name field with status information
        updateData.Name = `${deal.dealName} (${status})`;
        console.log('No status field found in Airtable, updating Name field with status information');
      }
      
      // Update in Airtable
      await this.dealTable.update(recordId, updateData);
      console.log(`Successfully updated deal status to "${status}" in Airtable`);
      
      // Update local cache even if Airtable update fails
      this.deals.set(id, updatedDeal);
      
      return updatedDeal;
    } catch (error) {
      console.error(`Error updating deal status in Airtable:`, error);
      
      // Update local cache even if Airtable update fails
      this.deals.set(id, updatedDeal);
      return updatedDeal;
    }
  }
  
  // Support request methods (removed as per user request)
  // Support request methods have been removed from the application
  
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