import { User, Deal, Comment, InsertUser, InsertDeal, InsertComment } from '@shared/schema';

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Deals
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDealById(id: string): Promise<Deal | null>;
  updateDeal(id: string, updates: Partial<Deal>): Promise<Deal>;
  getDeals(filters?: {
    status?: string;
    sellerId?: string;
    assignedReviewer?: string;
  }): Promise<Deal[]>;
  deleteDeal(id: string): Promise<void>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByDealId(dealId: string): Promise<Comment[]>;
  deleteComment(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private deals: Map<string, Deal> = new Map();
  private comments: Map<string, Comment> = new Map();

  constructor() {
    this.seedData();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private seedData() {
    // Create sample users
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@company.com',
      name: 'System Admin',
      role: 'admin',
      department: 'operations',
      createdAt: new Date(),
    };

    const seller: User = {
      id: 'seller-1',
      email: 'seller@company.com',
      name: 'John Seller',
      role: 'seller',
      department: 'sales',
      createdAt: new Date(),
    };

    const reviewer: User = {
      id: 'reviewer-1',
      email: 'reviewer@company.com',
      name: 'Jane Reviewer',
      role: 'department_reviewer',
      department: 'finance',
      createdAt: new Date(),
    };

    const approver: User = {
      id: 'approver-1',
      email: 'approver@company.com',
      name: 'Bob Approver',
      role: 'approver',
      department: 'operations',
      createdAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(seller.id, seller);
    this.users.set(reviewer.id, reviewer);
    this.users.set(approver.id, approver);

    // Create sample deals
    const deal1: Deal = {
      id: 'deal-1',
      title: 'Enterprise Software License',
      customer: 'Acme Corporation',
      value: '125000.00',
      currency: 'USD',
      status: 'submitted',
      priority: 'high',
      description: 'Annual enterprise software license for Acme Corporation including premium support and consulting.',
      sellerId: seller.id,
      assignedReviewers: [reviewer.id],
      approvalHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const deal2: Deal = {
      id: 'deal-2',
      title: 'Cloud Services Contract',
      customer: 'TechStart Inc',
      value: '85000.00',
      currency: 'USD',
      status: 'under_review',
      priority: 'medium',
      description: 'Multi-year cloud infrastructure and services contract.',
      sellerId: seller.id,
      assignedReviewers: [reviewer.id],
      approvalHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.deals.set(deal1.id, deal1);
    this.deals.set(deal2.id, deal2);
  }

  // User methods
  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const usersArray = Array.from(this.users.values());
    for (const user of usersArray) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Deal methods
  async createDeal(dealData: InsertDeal): Promise<Deal> {
    const deal: Deal = {
      ...dealData,
      id: this.generateId(),
      approvalHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deals.set(deal.id, deal);
    return deal;
  }

  async getDealById(id: string): Promise<Deal | null> {
    return this.deals.get(id) || null;
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const deal = this.deals.get(id);
    if (!deal) {
      throw new Error('Deal not found');
    }
    const updatedDeal = { ...deal, ...updates, updatedAt: new Date() };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async getDeals(filters?: {
    status?: string;
    sellerId?: string;
    assignedReviewer?: string;
  }): Promise<Deal[]> {
    let deals = Array.from(this.deals.values());

    if (filters) {
      if (filters.status) {
        deals = deals.filter(deal => deal.status === filters.status);
      }
      if (filters.sellerId) {
        deals = deals.filter(deal => deal.sellerId === filters.sellerId);
      }
      if (filters.assignedReviewer) {
        deals = deals.filter(deal => 
          deal.assignedReviewers && deal.assignedReviewers.includes(filters.assignedReviewer!)
        );
      }
    }

    return deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteDeal(id: string): Promise<void> {
    this.deals.delete(id);
  }

  // Comment methods
  async createComment(commentData: InsertComment): Promise<Comment> {
    const comment: Comment = {
      ...commentData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async getCommentsByDealId(dealId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.dealId === dealId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }
}

export const storage = new MemStorage();