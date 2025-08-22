# Deal Desk Technical Implementation Guide - Production Fixes

**Purpose:** Detailed technical guide for fixing critical production readiness issues  
**Target:** Claude Code/Replit AI for implementation  
**Date:** August 21, 2025

---

## Critical Implementation Tasks

### 1. AUTHENTICATION SYSTEM REPLACEMENT

**Current Problem:** 
- File `shared/auth.ts:46-102` uses localStorage demo authentication
- File `client/src/pages/LoginPage.tsx:14-18` has fake login that just redirects
- No actual user validation or session management

**Required Implementation:**

```typescript
// shared/auth.ts - COMPLETE REPLACEMENT NEEDED
// Remove this entire mock system:
export function getCurrentUser(role?: string, department?: string): CurrentUser {
  let demoRole: UserRole = "seller";
  if (typeof window !== 'undefined' && window.localStorage) {
    demoRole = (localStorage.getItem('demo_user_role') as UserRole) || "seller";
  }
  return roleConfigs[demoRole]; // DELETE THIS ENTIRE FUNCTION
}

// Replace with real Okta SSO integration:
import { OktaAuth } from '@okta/okta-auth-js';
import jwt from 'jsonwebtoken';

interface OktaConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class AuthService {
  private oktaAuth: OktaAuth;
  
  constructor(config: OktaConfig) {
    this.oktaAuth = new OktaAuth({
      issuer: `https://${config.domain}/oauth2/default`,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: ['openid', 'profile', 'email', 'groups'],
      pkce: true,
    });
  }

  async signIn(): Promise<void> {
    return this.oktaAuth.signInWithRedirect();
  }

  async handleCallback(): Promise<User> {
    const tokens = await this.oktaAuth.token.parseFromUrl();
    this.oktaAuth.tokenManager.setTokens(tokens);
    
    const userInfo = await this.oktaAuth.getUser();
    return this.mapOktaUserToAppUser(userInfo);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.oktaAuth.isAuthenticated()) return null;
    
    const userInfo = await this.oktaAuth.getUser();
    return this.mapOktaUserToAppUser(userInfo);
  }

  private mapOktaUserToAppUser(oktaUser: any): User {
    // Map Okta groups to app roles
    const groups = oktaUser.groups || [];
    let role: UserRole = 'seller';
    
    if (groups.includes('Deal-Desk-Admins')) role = 'admin';
    else if (groups.includes('Deal-Desk-Approvers')) role = 'approver';
    else if (groups.includes('Deal-Desk-Reviewers')) role = 'department_reviewer';
    else if (groups.includes('Deal-Desk-Sellers')) role = 'seller';

    return {
      id: oktaUser.sub,
      email: oktaUser.email,
      name: oktaUser.name,
      role,
      department: this.getDepartmentFromGroups(groups),
    };
  }
}
```

**Server-side Authentication Middleware:**

```typescript
// server/middleware/auth.ts - NEW FILE NEEDED
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    department?: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify with Okta's public key
    const decoded = jwt.verify(token, process.env.OKTA_JWT_SECRET!) as any;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

**Update server/routes.ts - ADD AUTHENTICATION:**

```typescript
// server/routes.ts - ADD THESE IMPORTS AND MIDDLEWARE
import { authenticateToken, authorizeRole, AuthenticatedRequest } from './middleware/auth';

// PROTECT ALL ROUTES - Add before route definitions:
router.use(authenticateToken);

// UPDATE EACH ROUTE WITH PROPER AUTHORIZATION:

// Only sellers and admins can create deals
router.post("/deals", authorizeRole(['seller', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealData = {
      ...req.body,
      created_by: req.user!.id, // Use real user ID
      created_at: new Date(),
    };
    
    const deal = await storage.createDeal(dealData);
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create deal' });
  }
});

// Only deal owner or authorized roles can update
router.put("/deals/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = parseInt(req.params.id);
    const existingDeal = await storage.getDeal(dealId);
    
    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Check authorization
    const canEdit = req.user!.role === 'admin' || 
                   existingDeal.created_by === req.user!.id ||
                   (req.user!.role === 'approver' && ['under_review', 'negotiating'].includes(existingDeal.status));
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this deal' });
    }
    
    const updatedDeal = await storage.updateDeal(dealId, req.body);
    res.json(updatedDeal);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update deal' });
  }
});

// Only admins can delete deals
router.delete("/deals/:id", authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = parseInt(req.params.id);
    const success = await storage.deleteDeal(dealId);
    res.json({ success });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete deal' });
  }
});
```

---

### 2. DATA PERSISTENCE - DATABRICKS INTEGRATION

**Current Problem:**
- File `server/storage.ts:2440-2443` uses MemStorage() - all data lost on restart
- No database connection or persistence layer

**Required Implementation:**

**Step 1: Database Schema Creation**

```sql
-- Execute this in Databricks to create the required tables:

CREATE SCHEMA IF NOT EXISTS deal_desk_prod;
USE deal_desk_prod;

-- Users table
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    okta_id NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    first_name NVARCHAR(255),
    last_name NVARCHAR(255),
    role NVARCHAR(50) NOT NULL DEFAULT 'seller',
    department NVARCHAR(100),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Main deals table
CREATE TABLE deals (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    deal_name NVARCHAR(500) NOT NULL,
    deal_type NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'draft',
    
    -- Financial information
    total_deal_value DECIMAL(18,2),
    currency_code NVARCHAR(3) DEFAULT 'USD',
    
    -- Client information
    advertiser_name NVARCHAR(500),
    agency_name NVARCHAR(500),
    primary_contact_email NVARCHAR(255),
    
    -- Deal details
    campaign_start_date DATE,
    campaign_end_date DATE,
    sales_channel NVARCHAR(100),
    deal_description NTEXT,
    
    -- Metadata
    created_by NVARCHAR(255) NOT NULL, -- Okta user ID
    assigned_to NVARCHAR(255),
    priority NVARCHAR(20) DEFAULT 'normal',
    
    -- Timestamps
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    submitted_at DATETIME2,
    approved_at DATETIME2,
    
    FOREIGN KEY (created_by) REFERENCES users(okta_id),
    FOREIGN KEY (assigned_to) REFERENCES users(okta_id)
);

-- Deal approval workflow
CREATE TABLE deal_approvals (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    
    -- Approval stage info
    approval_stage INT NOT NULL,
    department NVARCHAR(100) NOT NULL,
    required_role NVARCHAR(50) NOT NULL,
    
    -- Assignment and status
    assigned_to NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'pending',
    
    -- Review details
    reviewer_notes NTEXT,
    reviewed_at DATETIME2,
    
    -- Timing
    created_at DATETIME2 DEFAULT GETDATE(),
    due_date DATETIME2,
    
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(okta_id)
);

-- Scoping requests
CREATE TABLE scoping_requests (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    deal_id BIGINT,
    
    -- Request details
    request_type NVARCHAR(100),
    description NTEXT NOT NULL,
    urgency NVARCHAR(20) DEFAULT 'normal',
    
    -- Status and assignment
    status NVARCHAR(50) DEFAULT 'open',
    assigned_to NVARCHAR(255),
    
    -- Response
    response NTEXT,
    completed_at DATETIME2,
    
    -- Metadata
    created_by NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(okta_id),
    FOREIGN KEY (assigned_to) REFERENCES users(okta_id)
);

-- Activity log for audit trail
CREATE TABLE deal_activity (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    user_id NVARCHAR(255) NOT NULL,
    
    -- Activity details
    activity_type NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000),
    
    -- Change tracking
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(okta_id)
);

-- Performance indexes
CREATE INDEX IX_deals_status ON deals(status);
CREATE INDEX IX_deals_created_by ON deals(created_by);
CREATE INDEX IX_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IX_deals_created_at ON deals(created_at);

CREATE INDEX IX_approvals_deal_id ON deal_approvals(deal_id);
CREATE INDEX IX_approvals_assigned_to ON deal_approvals(assigned_to);
CREATE INDEX IX_approvals_status ON deal_approvals(status);

CREATE INDEX IX_activity_deal_id ON deal_activity(deal_id);
CREATE INDEX IX_activity_user_id ON deal_activity(user_id);
CREATE INDEX IX_activity_created_at ON deal_activity(created_at);

CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_okta_id ON users(okta_id);
```

**Step 2: Databricks Adapter Implementation**

```typescript
// server/storage/databricksAdapter.ts - NEW FILE
import sql from 'mssql';
import { IStorage, Deal, User, DealApproval, ScopingRequest } from '../types';

interface DatabricksConfig {
  server: string;
  database: string;
  authentication: {
    type: 'azure-active-directory-access-token';
    options: {
      token: string;
    };
  };
  options: {
    encrypt: boolean;
    enableArithAbort: boolean;
  };
}

export class DatabricksAdapter implements IStorage {
  private pool: sql.ConnectionPool;
  private config: DatabricksConfig;

  constructor(config: DatabricksConfig) {
    this.config = config;
    this.pool = new sql.ConnectionPool(config);
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('Connected to Databricks successfully');
    } catch (error) {
      console.error('Failed to connect to Databricks:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.close();
  }

  // Deal Management
  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    const request = this.pool.request();
    
    // Add parameters to prevent SQL injection
    request.input('deal_name', sql.NVarChar(500), dealData.dealName);
    request.input('deal_type', sql.NVarChar(100), dealData.dealType);
    request.input('status', sql.NVarChar(50), dealData.status || 'draft');
    request.input('total_deal_value', sql.Decimal(18, 2), dealData.totalDealValue);
    request.input('currency_code', sql.NVarChar(3), dealData.currencyCode || 'USD');
    request.input('advertiser_name', sql.NVarChar(500), dealData.advertiserName);
    request.input('agency_name', sql.NVarChar(500), dealData.agencyName);
    request.input('primary_contact_email', sql.NVarChar(255), dealData.primaryContactEmail);
    request.input('campaign_start_date', sql.Date, dealData.campaignStartDate);
    request.input('campaign_end_date', sql.Date, dealData.campaignEndDate);
    request.input('sales_channel', sql.NVarChar(100), dealData.salesChannel);
    request.input('deal_description', sql.NText, dealData.dealDescription);
    request.input('created_by', sql.NVarChar(255), dealData.createdBy);
    request.input('priority', sql.NVarChar(20), dealData.priority || 'normal');

    const query = `
      INSERT INTO deals (
        deal_name, deal_type, status, total_deal_value, currency_code,
        advertiser_name, agency_name, primary_contact_email,
        campaign_start_date, campaign_end_date, sales_channel,
        deal_description, created_by, priority
      )
      OUTPUT INSERTED.*
      VALUES (
        @deal_name, @deal_type, @status, @total_deal_value, @currency_code,
        @advertiser_name, @agency_name, @primary_contact_email,
        @campaign_start_date, @campaign_end_date, @sales_channel,
        @deal_description, @created_by, @priority
      )
    `;

    try {
      const result = await request.query(query);
      return this.mapRowToDeal(result.recordset[0]);
    } catch (error) {
      console.error('Error creating deal:', error);
      throw new Error('Failed to create deal');
    }
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const request = this.pool.request();
    request.input('id', sql.BigInt, id);

    const query = 'SELECT * FROM deals WHERE id = @id';

    try {
      const result = await request.query(query);
      if (result.recordset.length === 0) return undefined;
      return this.mapRowToDeal(result.recordset[0]);
    } catch (error) {
      console.error('Error fetching deal:', error);
      throw new Error('Failed to fetch deal');
    }
  }

  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal> {
    const request = this.pool.request();
    request.input('id', sql.BigInt, id);
    
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const allowedFields = [
      'deal_name', 'deal_type', 'status', 'total_deal_value',
      'advertiser_name', 'agency_name', 'priority', 'assigned_to'
    ];

    Object.keys(updates).forEach(key => {
      const dbField = this.camelToSnakeCase(key);
      if (allowedFields.includes(dbField) && updates[key as keyof Deal] !== undefined) {
        updateFields.push(`${dbField} = @${key}`);
        request.input(key, this.getSqlTypeForField(dbField), updates[key as keyof Deal]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = GETDATE()');

    const query = `
      UPDATE deals 
      SET ${updateFields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    try {
      const result = await request.query(query);
      if (result.recordset.length === 0) {
        throw new Error('Deal not found');
      }
      return this.mapRowToDeal(result.recordset[0]);
    } catch (error) {
      console.error('Error updating deal:', error);
      throw new Error('Failed to update deal');
    }
  }

  async deleteDeal(id: number): Promise<boolean> {
    const request = this.pool.request();
    request.input('id', sql.BigInt, id);

    const query = 'DELETE FROM deals WHERE id = @id';

    try {
      const result = await request.query(query);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw new Error('Failed to delete deal');
    }
  }

  async getDeals(filters?: {
    status?: string;
    createdBy?: string;
    assignedTo?: string;
    department?: string;
  }): Promise<Deal[]> {
    const request = this.pool.request();
    
    let query = 'SELECT * FROM deals WHERE 1=1';
    
    if (filters?.status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar(50), filters.status);
    }
    
    if (filters?.createdBy) {
      query += ' AND created_by = @createdBy';
      request.input('createdBy', sql.NVarChar(255), filters.createdBy);
    }
    
    if (filters?.assignedTo) {
      query += ' AND assigned_to = @assignedTo';
      request.input('assignedTo', sql.NVarChar(255), filters.assignedTo);
    }
    
    query += ' ORDER BY created_at DESC';

    try {
      const result = await request.query(query);
      return result.recordset.map(row => this.mapRowToDeal(row));
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw new Error('Failed to fetch deals');
    }
  }

  // Activity Logging
  async logActivity(dealId: number, userId: string, activityType: string, description: string, oldValues?: any, newValues?: any): Promise<void> {
    const request = this.pool.request();
    request.input('deal_id', sql.BigInt, dealId);
    request.input('user_id', sql.NVarChar(255), userId);
    request.input('activity_type', sql.NVarChar(100), activityType);
    request.input('description', sql.NVarChar(1000), description);
    request.input('old_values', sql.NVarChar(sql.MAX), oldValues ? JSON.stringify(oldValues) : null);
    request.input('new_values', sql.NVarChar(sql.MAX), newValues ? JSON.stringify(newValues) : null);

    const query = `
      INSERT INTO deal_activity (deal_id, user_id, activity_type, description, old_values, new_values)
      VALUES (@deal_id, @user_id, @activity_type, @description, @old_values, @new_values)
    `;

    try {
      await request.query(query);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging shouldn't break main operations
    }
  }

  // Helper methods
  private mapRowToDeal(row: any): Deal {
    return {
      id: row.id,
      dealName: row.deal_name,
      dealType: row.deal_type,
      status: row.status,
      totalDealValue: row.total_deal_value,
      currencyCode: row.currency_code,
      advertiserName: row.advertiser_name,
      agencyName: row.agency_name,
      primaryContactEmail: row.primary_contact_email,
      campaignStartDate: row.campaign_start_date,
      campaignEndDate: row.campaign_end_date,
      salesChannel: row.sales_channel,
      dealDescription: row.deal_description,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private getSqlTypeForField(field: string): any {
    const typeMap: { [key: string]: any } = {
      'deal_name': sql.NVarChar(500),
      'deal_type': sql.NVarChar(100),
      'status': sql.NVarChar(50),
      'total_deal_value': sql.Decimal(18, 2),
      'advertiser_name': sql.NVarChar(500),
      'agency_name': sql.NVarChar(500),
      'priority': sql.NVarChar(20),
      'assigned_to': sql.NVarChar(255),
    };
    return typeMap[field] || sql.NVarChar(255);
  }
}
```

**Step 3: Update Storage Configuration**

```typescript
// server/storage.ts - REPLACE THE getStorage FUNCTION
import { DatabricksAdapter } from './storage/databricksAdapter';
import { MemStorage } from './storage/memStorage'; // Keep for development

function getStorage(): IStorage {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production' || environment === 'staging') {
    // Use Databricks in production/staging
    const config = {
      server: process.env.DATABRICKS_SERVER!,
      database: process.env.DATABRICKS_DATABASE!,
      authentication: {
        type: 'azure-active-directory-access-token' as const,
        options: {
          token: process.env.DATABRICKS_ACCESS_TOKEN!
        }
      },
      options: {
        encrypt: true,
        enableArithAbort: true
      }
    };
    
    const adapter = new DatabricksAdapter(config);
    
    // Initialize connection
    adapter.connect().catch(error => {
      console.error('Failed to connect to Databricks:', error);
      process.exit(1);
    });
    
    return adapter;
  } else {
    // Use in-memory storage for development only
    console.log("Using in-memory storage for development");
    return new MemStorage();
  }
}

export const storage = getStorage();
```

**Step 4: Environment Variables**

```bash
# Add to .env file:
NODE_ENV=production
DATABRICKS_SERVER=your-databricks-server.databricks.com
DATABRICKS_DATABASE=deal_desk_prod
DATABRICKS_ACCESS_TOKEN=your-access-token

# Okta Configuration
OKTA_DOMAIN=miq.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
OKTA_JWT_SECRET=your-jwt-secret
```

---

### 3. SECURITY MIDDLEWARE IMPLEMENTATION

**Current Problem:**
- File `server/index.ts` has no security middleware
- All API endpoints are unprotected
- No CORS, CSRF, rate limiting, or input validation

**Required Implementation:**

```typescript
// server/index.ts - ADD ALL SECURITY MIDDLEWARE
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult, param } from 'express-validator';
import compression from 'compression';
import morgan from 'morgan';

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.miq.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://your-production-domain.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit for sensitive operations
  message: {
    error: 'Too many sensitive operations from this IP, please try again later.',
  }
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/deals', strictLimiter); // Stricter limits on deal operations

// Request parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Input Validation Middleware
export const validateDealCreation = [
  body('dealName')
    .isLength({ min: 1, max: 500 })
    .withMessage('Deal name must be between 1 and 500 characters')
    .trim()
    .escape(),
  
  body('dealType')
    .isIn(['new_business', 'renewal', 'upsell', 'expansion'])
    .withMessage('Invalid deal type'),
  
  body('totalDealValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total deal value must be a positive number'),
  
  body('advertiserName')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Advertiser name cannot exceed 500 characters')
    .trim()
    .escape(),
  
  body('agencyName')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Agency name cannot exceed 500 characters')
    .trim()
    .escape(),
  
  body('primaryContactEmail')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('salesChannel')
    .optional()
    .isIn(['direct', 'partner', 'agency', 'programmatic'])
    .withMessage('Invalid sales channel'),
  
  body('campaignStartDate')
    .optional()
    .isISO8601()
    .withMessage('Campaign start date must be a valid date'),
  
  body('campaignEndDate')
    .optional()
    .isISO8601()
    .withMessage('Campaign end date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.body.campaignStartDate && endDate) {
        if (new Date(endDate) <= new Date(req.body.campaignStartDate)) {
          throw new Error('Campaign end date must be after start date');
        }
      }
      return true;
    }),
];

export const validateDealUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Deal ID must be a positive integer'),
  
  body('dealName')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Deal name must be between 1 and 500 characters')
    .trim()
    .escape(),
  
  body('status')
    .optional()
    .isIn([
      'draft', 'scoping', 'submitted', 'under_review', 
      'revision_requested', 'negotiating', 'approved', 
      'contract_drafting', 'client_review', 'signed', 'lost'
    ])
    .withMessage('Invalid deal status'),
  
  // Add other validation rules as needed
];

export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
];

// Validation Error Handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (error.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});
```

**Update server/routes.ts with Validation:**

```typescript
// server/routes.ts - ADD VALIDATION TO ALL ROUTES
import { 
  validateDealCreation, 
  validateDealUpdate, 
  validateIdParam, 
  handleValidationErrors 
} from './index';

// Apply validation to routes
router.post("/deals", 
  authenticateToken,
  authorizeRole(['seller', 'admin']),
  validateDealCreation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealData = {
        ...req.body,
        created_by: req.user!.id,
        created_at: new Date(),
      };
      
      const deal = await storage.createDeal(dealData);
      
      // Log activity
      await storage.logActivity(
        deal.id,
        req.user!.id,
        'created',
        `Deal "${deal.dealName}" created`
      );
      
      res.status(201).json(deal);
    } catch (error) {
      console.error('Error creating deal:', error);
      res.status(400).json({ error: 'Failed to create deal' });
    }
  }
);

router.put("/deals/:id",
  authenticateToken,
  validateDealUpdate,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const existingDeal = await storage.getDeal(dealId);
      
      if (!existingDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      // Authorization check
      const canEdit = req.user!.role === 'admin' || 
                     existingDeal.created_by === req.user!.id ||
                     (req.user!.role === 'approver' && ['under_review', 'negotiating'].includes(existingDeal.status));
      
      if (!canEdit) {
        return res.status(403).json({ error: 'Not authorized to edit this deal' });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, req.body);
      
      // Log activity
      await storage.logActivity(
        dealId,
        req.user!.id,
        'updated',
        `Deal "${updatedDeal.dealName}" updated`,
        existingDeal,
        updatedDeal
      );
      
      res.json(updatedDeal);
    } catch (error) {
      console.error('Error updating deal:', error);
      res.status(400).json({ error: 'Failed to update deal' });
    }
  }
);

router.get("/deals/:id",
  authenticateToken,
  validateIdParam,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      // Check if user can view this deal
      const canView = req.user!.role === 'admin' ||
                     deal.created_by === req.user!.id ||
                     ['approver', 'department_reviewer'].includes(req.user!.role);
      
      if (!canView) {
        return res.status(403).json({ error: 'Not authorized to view this deal' });
      }
      
      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  }
);

// Remove all console.log statements and replace with proper logging
// REMOVE these lines throughout the codebase:
// console.log(`✅ Deal ${dealId} status auto-updated: ${deal.status} → ${newStatus}`);
// console.log(`📧 NOTIFICATION: [${notification.type}] ${notification.title}`);
// console.log("Using in-memory storage exclusively as requested");

// Replace with proper logging using winston or similar
```

---

### 4. CODE CLEANUP FOR PRODUCTION

**Files to Delete (Legacy/Backup Files):**

```bash
# Remove these files - they are duplicates/legacy:
rm client/src/pages/Dashboard.tsx.legacy
rm client/src/pages/Home.tsx.legacy  
rm client/src/components/ScopingRequestsDashboard.tsx.legacy
rm client/src/pages/SubmitDeal.tsx.backup
rm client/src/pages/SubmitDeal.tsx.broken

# Remove any other .legacy, .backup, .old, .bak files
find . -name "*.legacy" -delete
find . -name "*.backup" -delete
find . -name "*.old" -delete
find . -name "*.bak" -delete
```

**Replace Console Logging:**

```typescript
// server/logger.ts - NEW FILE
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'deal-desk-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage throughout codebase:
// Replace: console.log('message')
// With: logger.info('message')
// Replace: console.error('error') 
// With: logger.error('error')
```

**Environment Variables Setup:**

```bash
# .env.production
NODE_ENV=production
PORT=5000

# Database
DATABRICKS_SERVER=your-databricks-server.databricks.com
DATABRICKS_DATABASE=deal_desk_prod
DATABRICKS_ACCESS_TOKEN=your-access-token

# Authentication
OKTA_DOMAIN=miq.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
OKTA_JWT_SECRET=your-jwt-secret

# Security
ALLOWED_ORIGINS=https://your-production-domain.com,https://your-staging-domain.com
SESSION_SECRET=your-secure-session-secret

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# AI/Claude
CLAUDE_API_KEY=your-claude-api-key
```

---

### 5. TESTING IMPLEMENTATION

**Setup Jest and Testing Libraries:**

```bash
npm install --save-dev jest @types/jest supertest @testing-library/react @testing-library/jest-dom
```

**Jest Configuration:**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

**Critical Test Examples:**

```typescript
// tests/auth.test.ts
import request from 'supertest';
import { app } from '../server/index';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  const validToken = jwt.sign(
    { 
      sub: 'test-user-id', 
      email: 'test@miq.com', 
      role: 'seller' 
    },
    process.env.OKTA_JWT_SECRET!,
    { expiresIn: '1h' }
  );

  test('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/deals')
      .expect(401);
    
    expect(response.body.error).toBe('Access token required');
  });

  test('should accept requests with valid token', async () => {
    const response = await request(app)
      .get('/api/deals')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });

  test('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { sub: 'test-user', role: 'seller' },
      process.env.OKTA_JWT_SECRET!,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/deals')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(403);
  });
});

// tests/deals.test.ts
describe('Deal API Endpoints', () => {
  test('should create deal with valid data', async () => {
    const dealData = {
      dealName: 'Test Deal',
      dealType: 'new_business',
      totalDealValue: 10000,
      advertiserName: 'Test Advertiser'
    };

    const response = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${validToken}`)
      .send(dealData)
      .expect(201);

    expect(response.body.dealName).toBe('Test Deal');
    expect(response.body.id).toBeDefined();
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${validToken}`)
      .send({}) // Empty data
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  test('should enforce role-based access', async () => {
    const dealId = 1;
    const sellerToken = jwt.sign(
      { sub: 'seller-id', role: 'seller' },
      process.env.OKTA_JWT_SECRET!
    );

    // Seller should not be able to delete deals
    await request(app)
      .delete(`/api/deals/${dealId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(403);
  });
});

// tests/database.test.ts
import { DatabricksAdapter } from '../server/storage/databricksAdapter';

describe('Database Operations', () => {
  let adapter: DatabricksAdapter;

  beforeAll(async () => {
    // Use test database
    const testConfig = {
      server: process.env.TEST_DATABRICKS_SERVER!,
      database: 'deal_desk_test',
      // ... config
    };
    adapter = new DatabricksAdapter(testConfig);
    await adapter.connect();
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  test('should persist deal data', async () => {
    const dealData = {
      dealName: 'Database Test Deal',
      dealType: 'new_business',
      createdBy: 'test-user'
    };

    const createdDeal = await adapter.createDeal(dealData);
    expect(createdDeal.id).toBeDefined();

    const retrievedDeal = await adapter.getDeal(createdDeal.id);
    expect(retrievedDeal?.dealName).toBe('Database Test Deal');
  });
});
```

**React Component Tests:**

```typescript
// tests/components/DealForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealForm } from '../../client/src/components/DealForm';

describe('DealForm Component', () => {
  test('should validate required fields', async () => {
    render(<DealForm onSubmit={jest.fn()} />);
    
    const submitButton = screen.getByText('Submit Deal');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Deal name is required')).toBeInTheDocument();
    });
  });

  test('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<DealForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Deal Name'), {
      target: { value: 'Test Deal' }
    });
    
    fireEvent.change(screen.getByLabelText('Deal Type'), {
      target: { value: 'new_business' }
    });
    
    fireEvent.click(screen.getByText('Submit Deal'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        dealName: 'Test Deal',
        dealType: 'new_business'
      });
    });
  });
});
```

---

## Implementation Priority Order

1. **CRITICAL (Week 1):**
   - Authentication system replacement
   - Basic security middleware (CORS, rate limiting)
   - Remove demo authentication entirely

2. **HIGH PRIORITY (Week 1-2):**
   - Databricks connection and schema setup
   - Data migration from memory storage
   - Input validation on API endpoints

3. **MEDIUM PRIORITY (Week 2-3):**
   - Complete authorization implementation
   - Activity logging
   - Error handling improvements

4. **CLEANUP (Week 3-4):**
   - Remove legacy files
   - Replace console.log with proper logging
   - Environment variable configuration

5. **TESTING (Week 4-5):**
   - Critical path testing
   - Security testing
   - Integration testing

6. **MONITORING (Week 5-6):**
   - Production logging setup
   - Performance monitoring
   - Health checks

## Environment-Specific Configurations

**Development:**
- Use in-memory storage (existing)
- Relaxed CORS policies
- Detailed error messages
- Console logging enabled

**Staging:**
- Use Databricks test environment
- Production-like security
- Comprehensive logging
- Real authentication testing

**Production:**
- Full Databricks integration
- Strict security policies
- Minimal error disclosure
- Performance monitoring

This guide provides the complete technical implementation needed to make the Deal Desk application production-ready. Each section includes specific code examples, file locations, and detailed implementation steps that can be directly used by Claude Code/Replit for implementation.