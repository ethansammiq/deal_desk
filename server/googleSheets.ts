import { google, sheets_v4 } from 'googleapis';
import { IStorage } from './storage';
import { 
  User, 
  InsertUser, 
  Deal, 
  InsertDeal, 
  SupportRequest, 
  InsertSupportRequest 
} from '@shared/schema';

export class GoogleSheetsStorage implements IStorage {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private userSheet = 'Users';
  private dealSheet = 'Deals';
  private supportRequestSheet = 'SupportRequests';
  
  // Local cache to reduce API calls
  private users: Map<number, User> = new Map();
  private deals: Map<number, Deal> = new Map();
  private supportRequests: Map<number, SupportRequest> = new Map();
  
  // Current IDs for new records
  private userCurrentId = 1;
  private dealCurrentId = 1;
  private supportCurrentId = 1;
  
  constructor() {
    // Initialize the Google Sheets API client
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';
    
    // Initialize the spreadsheet with the required sheets if they don't exist
    this.initializeSpreadsheet();
  }
  
  private async initializeSpreadsheet() {
    try {
      // Get info about the spreadsheet to check existing sheets
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
      const requiredSheets = [this.userSheet, this.dealSheet, this.supportRequestSheet];
      const sheetsToCreate = requiredSheets.filter(sheet => !existingSheets.includes(sheet));
      
      if (sheetsToCreate.length > 0) {
        // Create the missing sheets
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: sheetsToCreate.map(title => ({
              addSheet: {
                properties: { title }
              }
            }))
          }
        });
        
        // Initialize headers for each sheet
        this.initializeSheetHeaders();
      }
      
      // Load existing data to determine the next IDs
      await this.loadExistingData();
      
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
    }
  }
  
  private async initializeSheetHeaders() {
    try {
      // User sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.userSheet}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['id', 'username', 'email', 'role']]
        }
      });
      
      // Deal sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.dealSheet}!A1:P1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'id', 'referenceNumber', 'dealName', 'dealType', 'description', 
            'clientName', 'clientType', 'industry', 'region', 'department',
            'status', 'totalValue', 'contractTerm', 'discountPercentage', 
            'costPercentage', 'expectedCloseDate'
          ]]
        }
      });
      
      // Support request sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.supportRequestSheet}!A1:I1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'id', 'supportType', 'requestTitle', 'description', 'status',
            'requesterId', 'relatedDealId', 'priorityLevel', 'deadline'
          ]]
        }
      });
    } catch (error) {
      console.error('Error initializing sheet headers:', error);
    }
  }
  
  private async loadExistingData() {
    try {
      // Load users
      const usersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.userSheet}!A2:D`
      });
      
      const userRows = usersResponse.data.values || [];
      if (userRows.length > 0) {
        userRows.forEach(row => {
          const user: User = {
            id: parseInt(row[0]),
            username: row[1],
            password: row[2]
          };
          this.users.set(user.id, user);
          if (user.id >= this.userCurrentId) {
            this.userCurrentId = user.id + 1;
          }
        });
      }
      
      // Load deals
      const dealsResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.dealSheet}!A2:P`
      });
      
      const dealRows = dealsResponse.data.values || [];
      if (dealRows.length > 0) {
        dealRows.forEach(row => {
          const deal: Deal = {
            id: parseInt(row[0]),
            referenceNumber: row[1],
            dealName: row[2],
            dealType: row[3],
            description: row[4],
            clientName: row[5],
            clientType: row[6],
            industry: row[7],
            region: row[8],
            department: row[9],
            status: row[10],
            totalValue: parseFloat(row[11]),
            contractTerm: parseInt(row[12]),
            discountPercentage: parseFloat(row[13]),
            costPercentage: parseFloat(row[14]),
            expectedCloseDate: row[15]
          };
          this.deals.set(deal.id, deal);
          if (deal.id >= this.dealCurrentId) {
            this.dealCurrentId = deal.id + 1;
          }
        });
      }
      
      // Load support requests
      const supportResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.supportRequestSheet}!A2:I`
      });
      
      const supportRows = supportResponse.data.values || [];
      if (supportRows.length > 0) {
        supportRows.forEach(row => {
          const request: SupportRequest = {
            id: parseInt(row[0]),
            supportType: row[1],
            requestTitle: row[2],
            description: row[3],
            status: row[4],
            requesterId: parseInt(row[5]),
            relatedDealId: row[6] ? parseInt(row[6]) : undefined,
            priorityLevel: row[7],
            deadline: row[8]
          };
          this.supportRequests.set(request.id, request);
          if (request.id >= this.supportCurrentId) {
            this.supportCurrentId = request.id + 1;
          }
        });
      }
      
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  }
  
  private async appendRow(sheetName: string, values: any[]) {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [values]
        }
      });
    } catch (error) {
      console.error(`Error appending row to ${sheetName}:`, error);
      throw error;
    }
  }
  
  private async updateRow(sheetName: string, id: number, values: any[]) {
    try {
      // Find the row for this ID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`
      });
      
      const ids = response.data.values || [];
      let rowIndex = -1;
      
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] == id.toString()) {
          rowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }
      
      if (rowIndex === -1) {
        throw new Error(`Record with ID ${id} not found in ${sheetName}`);
      }
      
      // Update the row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      });
    } catch (error) {
      console.error(`Error updating row in ${sheetName}:`, error);
      throw error;
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
    
    // Add to local cache
    this.users.set(id, user);
    
    // Add to Google Sheet
    await this.appendRow(
      this.userSheet, 
      [id, user.username, user.password]
    );
    
    return user;
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
    
    // Add to local cache
    this.deals.set(id, deal);
    
    // Add to Google Sheet
    await this.appendRow(
      this.dealSheet, 
      [
        id, 
        referenceNumber, 
        deal.dealName, 
        deal.dealType, 
        deal.description,
        deal.clientName, 
        deal.clientType, 
        deal.industry, 
        deal.region, 
        deal.department,
        deal.status, 
        deal.totalValue, 
        deal.contractTerm, 
        deal.discountPercentage,
        deal.costPercentage, 
        deal.expectedCloseDate
      ]
    );
    
    return deal;
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
    
    // Update local cache
    this.deals.set(id, updatedDeal);
    
    // Update in Google Sheet
    await this.updateRow(
      this.dealSheet, 
      id, 
      [
        id, 
        updatedDeal.referenceNumber, 
        updatedDeal.dealName, 
        updatedDeal.dealType, 
        updatedDeal.description,
        updatedDeal.clientName, 
        updatedDeal.clientType, 
        updatedDeal.industry, 
        updatedDeal.region, 
        updatedDeal.department,
        updatedDeal.status, 
        updatedDeal.totalValue, 
        updatedDeal.contractTerm, 
        updatedDeal.discountPercentage,
        updatedDeal.costPercentage, 
        updatedDeal.expectedCloseDate
      ]
    );
    
    return updatedDeal;
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
    
    // Add to local cache
    this.supportRequests.set(id, request);
    
    // Add to Google Sheet
    await this.appendRow(
      this.supportRequestSheet, 
      [
        id, 
        request.supportType, 
        request.requestTitle, 
        request.description, 
        request.status,
        request.requesterId, 
        request.relatedDealId || '', 
        request.priorityLevel, 
        request.deadline || ''
      ]
    );
    
    return request;
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
    
    // Update local cache
    this.supportRequests.set(id, updatedRequest);
    
    // Update in Google Sheet
    await this.updateRow(
      this.supportRequestSheet, 
      id, 
      [
        id, 
        updatedRequest.supportType, 
        updatedRequest.requestTitle, 
        updatedRequest.description, 
        updatedRequest.status,
        updatedRequest.requesterId, 
        updatedRequest.relatedDealId || '', 
        updatedRequest.priorityLevel, 
        updatedRequest.deadline || ''
      ]
    );
    
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