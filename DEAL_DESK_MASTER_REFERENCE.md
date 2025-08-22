# Deal Desk Application - Master Reference Guide

**Version:** 2.0  
**Last Updated:** August 22, 2025  
**Created by:** Ethan Sam (Growth & Innovation Associate)  
**For:** Van Ngo (RVP Trading, Northeast) & MiQ Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Architecture](#application-architecture) 
3. [Business Logic & Workflow](#business-logic--workflow)
4. [Database Schema](#database-schema)
5. [Current Implementation Status](#current-implementation-status)
6. [Production Readiness Assessment](#production-readiness-assessment)
7. [Technical Configuration](#technical-configuration)
8. [Security & Authentication](#security--authentication)
9. [Integration Points](#integration-points)
10. [Development Environment](#development-environment)

---

## Executive Summary

### Application Purpose
The Deal Desk application is a comprehensive commercial deal management system that streamlines the submission, approval, and tracking of deals through a multi-stage workflow process.

### Current Status
- **Functional Quality:** ⭐⭐⭐⭐⭐ Excellent business logic and UX
- **Production Readiness:** ⭐⭐ Critical gaps in security and infrastructure
- **Timeline to Production:** 6-8 weeks with focused engineering effort

### Key Stakeholders
- **Van Ngo** - RVP Trading, Northeast (Business Owner)
- **Anthony** - Engineering Leadership (Database/Infrastructure)
- **IT Team** - Okta SSO Integration
- **Security Team** - Compliance and Security Review

---

## Application Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- TailwindCSS for styling
- Radix UI component library
- Wouter for routing
- React Hook Form for form management

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Drizzle ORM for database operations
- Anthropic Claude API integration

**Current Data Storage:**
- In-memory storage (MemStorage) - **CRITICAL ISSUE**
- Planned migration to Databricks

**Key Dependencies:**
```json
{
  "@anthropic-ai/sdk": "^0.37.0",
  "express": "^4.21.2", 
  "drizzle-orm": "^0.39.1",
  "react": "^18.3.1",
  "wouter": "^3.3.5"
}
```

### Component Structure

**Core Pages:**
- `LoginPage.tsx` - Authentication entry point (currently demo only)
- `UnifiedDashboard.tsx` - Main dashboard with role-based views
- `SubmitDeal.tsx` - Deal submission form
- `DealDetails.tsx` - Individual deal management
- `DealsPage.tsx` - Deal analytics and listing

**Key Components:**
- `ConsolidatedDashboard.tsx` - Role-specific dashboard views
- `ApprovalWorkflowDashboard.tsx` - Approval queue management
- `DealGenieAssessment.tsx` - AI-powered deal analysis
- `StatusTransitionModal.tsx` - Deal status management

---

## Business Logic & Workflow

### User Roles & Permissions

**Role Hierarchy:**
1. **Seller** - Creates and manages own deals
2. **Department Reviewer** - Reviews deals for specific departments  
3. **Approver** - Business approval authority
4. **Admin** - Full system access

**Role Configuration (from `shared/auth.ts`):**
```typescript
export const userRoles = ["seller", "department_reviewer", "approver", "admin"] as const;
export const departmentTypes = ["trading", "finance", "creative", "marketing", "product", "solutions", "legal"] as const;
```

### Deal Status Workflow

**Complete Status Flow:**
```
draft → scoping → submitted → under_review → revision_requested → negotiating → approved → contract_drafting → client_review → signed → lost
```

**Status Transitions (from `shared/status-transitions.ts`):**
```typescript
export const STATUS_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ['scoping', 'submitted'],
  scoping: ['submitted'], 
  submitted: ['under_review', 'lost'],
  under_review: ['revision_requested', 'negotiating', 'approved', 'lost'],
  revision_requested: ['under_review', 'lost'],
  negotiating: ['revision_requested', 'approved', 'lost'],
  approved: ['contract_drafting', 'lost'],
  contract_drafting: ['client_review', 'lost'],
  client_review: ['signed', 'negotiating', 'lost'],
  signed: [], // Terminal success
  lost: []    // Terminal failure
};
```

### Approval Matrix

**Multi-Stage Approval Process:**
1. **Stage 1:** Department reviews (Trading, Finance, Creative, etc.)
2. **Stage 2:** Business approver sign-off
3. **Stage 3:** Legal review and contract drafting
4. **Stage 4:** Client review and signature

**Role-Based Permissions:**
- **Sellers:** Can transition deals in draft, scoping, and revision_requested states
- **Department Reviewers:** Handle stage 1 approvals for their department
- **Approvers:** Manage stage 2 business approvals
- **Legal Team:** Handle contract drafting and client review phases
- **Admins:** Full access to all status transitions

---

## Database Schema

### Current Schema (Drizzle ORM)

**Core Tables:**

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'seller',
  department TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Deals Table:**
```sql
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  deal_name TEXT NOT NULL,
  deal_type TEXT,
  status TEXT DEFAULT 'draft',
  draft_type TEXT, -- 'scoping_draft' or 'submission_draft'
  sales_channel TEXT,
  advertiser_name TEXT,
  agency_name TEXT,
  total_deal_value DOUBLE PRECISION,
  contract_term INTEGER,
  created_by INTEGER NOT NULL,
  assigned_to INTEGER,
  priority TEXT DEFAULT 'normal',
  revision_count INTEGER DEFAULT 0,
  is_revision BOOLEAN DEFAULT false,
  parent_submission_id INTEGER,
  revision_reason TEXT,
  can_edit BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP
);
```

**Deal Scoping Requests:**
```sql
CREATE TABLE deal_scoping_requests (
  id SERIAL PRIMARY KEY,
  email TEXT,
  sales_channel TEXT NOT NULL,
  advertiser_name TEXT,
  agency_name TEXT,
  region TEXT,
  deal_type TEXT,
  growth_opportunity_miq TEXT NOT NULL,
  growth_ambition DOUBLE PRECISION NOT NULL,
  growth_opportunity_client TEXT NOT NULL,
  client_asks TEXT,
  request_title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  converted_deal_id INTEGER,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Recommended Production Schema (Databricks)

**For Anthony - Complete Production Schema:**

```sql
-- Users and Authentication
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
    draft_type NVARCHAR(50), -- 'scoping_draft' or 'submission_draft'
    
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
    
    -- Revision tracking
    revision_count INT DEFAULT 0,
    is_revision BIT DEFAULT 0,
    parent_submission_id BIGINT,
    revision_reason NTEXT,
    
    -- Permissions
    can_edit BIT DEFAULT 1,
    
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
CREATE INDEX IX_approvals_deal_id ON deal_approvals(deal_id);
CREATE INDEX IX_approvals_assigned_to ON deal_approvals(assigned_to);
CREATE INDEX IX_activity_deal_id ON deal_activity(deal_id);
```

---

## Current Implementation Status

### ✅ Completed Features

**Core Functionality:**
- Multi-role dashboard system with personalized views
- Complete deal submission workflow
- Status transition management with role-based permissions
- Deal scoping request system
- Approval workflow with department routing
- Deal analytics and reporting
- AI-powered deal assessment (Deal Genie)
- Responsive UI with clean UX design

**Business Logic:**
- 11-stage deal status workflow
- Role-based access control (4 user types)
- Department-based approval routing (7 departments)
- Draft management (scoping vs submission drafts)
- Revision tracking and management
- Deal conversion from scoping to submission

### 🚨 Critical Issues Requiring Immediate Attention

**1. Authentication System (CRITICAL)**
- **Current State:** Mock/demo authentication using localStorage
- **File:** `shared/auth.ts:47-102`
- **Risk:** Anyone can access any role/data without authentication
- **Fix Required:** Okta SSO integration with real JWT validation

**2. Data Persistence (CRITICAL)**
- **Current State:** In-memory storage only (MemStorage)
- **File:** `server/storage.ts:2440-2443`
- **Risk:** Complete data loss on every server restart
- **Fix Required:** Databricks integration with proper connection management

**3. Security Vulnerabilities (HIGH)**
- **Missing:** CORS, CSRF, rate limiting, input validation
- **Risk:** API endpoints completely unprotected
- **Fix Required:** Security middleware implementation

**4. Zero Test Coverage (MEDIUM)**
- **Current State:** No automated tests
- **Risk:** No regression protection during development
- **Fix Required:** Jest/React Testing Library setup

---

## Production Readiness Assessment

### Security Assessment

**Current Security Posture:** 🔴 **CRITICAL VULNERABILITIES**

**Major Security Gaps:**
1. **No Real Authentication:** Mock system allows anyone to access everything
2. **Unprotected APIs:** All endpoints accessible without authentication
3. **No Input Validation:** XSS and injection attack vectors
4. **Missing Security Headers:** No CORS, CSRF protection, or rate limiting
5. **Secrets Exposure:** Hardcoded values in client code

**Compliance Impact:**
- **SOC2:** Fails audit requirements for access controls
- **GDPR:** No data protection or user consent mechanisms
- **Corporate Policies:** Violates MiQ security standards

### Performance Assessment

**Current Performance:** 🟡 **NEEDS OPTIMIZATION**

**Bundle Analysis:**
- **Current Size:** ~2MB unoptimized
- **Target Size:** <500KB initial load
- **Issues:** No code splitting, lazy loading, or optimization

**Database Performance:**
- **Current:** In-memory (fast but volatile)
- **Production Need:** Databricks with proper indexing and connection pooling

### Infrastructure Assessment

**Current Infrastructure:** 🔴 **NOT PRODUCTION READY**

**Missing Components:**
- Containerization (Docker)
- CI/CD pipeline
- Environment configuration management
- Monitoring and alerting
- Load balancing and auto-scaling
- Backup and disaster recovery

---

## Technical Configuration

### Environment Variables

**Required for Production:**
```bash
# Authentication
OKTA_DOMAIN=miq.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
OKTA_JWT_SECRET=your-jwt-secret

# Database
DATABRICKS_SERVER=your-databricks-server.databricks.com
DATABRICKS_DATABASE=deal_desk_prod
DATABRICKS_ACCESS_TOKEN=your-access-token

# Security
ALLOWED_ORIGINS=https://your-production-domain.com
SESSION_SECRET=your-secure-session-secret

# AI Services
CLAUDE_API_KEY=your-claude-api-key

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Build Configuration

**Scripts (from package.json):**
```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

---

## Security & Authentication

### Current Authentication Flow

**CRITICAL SECURITY ISSUE - Current Implementation:**
```typescript
// shared/auth.ts:47-54 - REPLACE IMMEDIATELY
export function getCurrentUser(role?: string): CurrentUser {
  let demoRole: UserRole = "seller";
  if (typeof window !== 'undefined' && window.localStorage) {
    demoRole = (localStorage.getItem('demo_user_role') as UserRole) || "seller";
  }
  return roleConfigs[demoRole]; // Returns fake hardcoded users!
}
```

**Required Production Authentication:**
1. **Okta SSO Integration:** Real user authentication with corporate credentials
2. **JWT Token Validation:** Server-side token verification
3. **Session Management:** Secure session handling with proper expiration
4. **Role Mapping:** Map Okta groups to application roles
5. **Audit Logging:** Track all authentication events

### Security Middleware Requirements

**Essential Security Stack:**
```typescript
// Required middleware stack
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin protection  
app.use(rateLimit()); // DoS protection
app.use(expressValidator()); // Input validation
app.use(csrfProtection()); // CSRF protection
app.use(authenticateToken); // JWT validation
app.use(authorizeRole); // Role-based access
```

---

## Integration Points

### Databricks Integration

**Current Status:** Not implemented  
**Priority:** Critical  
**Timeline:** Week 1-2 of production work

**Integration Requirements:**
1. **Connection Management:** Secure connection pooling
2. **Environment Separation:** Test, Staging, Production databases
3. **Migration Scripts:** Move from in-memory to persistent storage
4. **Backup Strategy:** Automated backups and disaster recovery

### Okta SSO Integration

**Current Status:** Not implemented  
**Priority:** Critical  
**Timeline:** Week 1 of production work

**Integration Requirements:**
1. **SAML/OAuth Configuration:** Corporate SSO setup
2. **Group Mapping:** Map Okta groups to app roles
3. **User Provisioning:** Automatic user creation from Okta
4. **Session Management:** Secure token handling

### AI Services Integration

**Current Status:** Basic Claude API integration  
**Enhancement Needed:** Production optimization

**Components:**
- **Deal Genie Assessment:** AI-powered deal analysis
- **Chatbot Support:** Deal guidance and FAQ
- **Document Processing:** Contract and proposal analysis

### AWS Deployment Integration

**Current Status:** Not implemented  
**Priority:** High  
**Timeline:** Week 3-4 of production work

**Infrastructure Requirements:**
- **Container Strategy:** Docker + ECS or Kubernetes
- **Load Balancing:** Application Load Balancer
- **Auto-scaling:** Based on traffic patterns
- **Monitoring:** CloudWatch integration
- **Security:** VPC, security groups, WAF

---

## Development Environment

### Local Development Setup

**Prerequisites:**
- Node.js 18+
- TypeScript 5.6+
- Git

**Quick Start:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript checking
npm run check

# Build for production
npm run build
```

### Replit Environment

**Current Setup:**
- Environment: Replit development platform
- Storage: In-memory (data lost on restart)
- Authentication: Demo/mock system
- Database: No persistent database connection

**Replit Configuration Files:**
- `replit.nix` - Environment configuration
- `replit.md` - Platform documentation

### File Structure

**Key Directories:**
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   └── index.html        # Entry point
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data layer (currently in-memory)
│   └── anthropic.ts      # AI service integration
├── shared/               # Shared types and utilities
│   ├── auth.ts           # Authentication (currently mock)
│   ├── schema.ts         # Database schema definitions
│   ├── types.ts          # TypeScript type definitions
│   └── status-transitions.ts # Business workflow logic
└── package.json          # Project configuration
```

---

## Key Business Constants

### Deal Types
```typescript
const dealTypes = ["new_business", "renewal", "upsell", "expansion"];
```

### Sales Channels  
```typescript
const salesChannels = ["direct", "partner", "agency", "programmatic"];
```

### Regions
```typescript
const regions = ["north_america", "emea", "apac", "latam"];
```

### Priority Levels
```typescript
const priorities = ["low", "normal", "high", "urgent"];
```

---

## Critical Action Items for Production

### Immediate (Week 1)
1. **Implement Okta SSO authentication**
2. **Replace in-memory storage with Databricks**
3. **Add basic security middleware**
4. **Remove all mock/demo authentication code**

### Short-term (Week 2-3)
1. **Complete security hardening**
2. **Implement comprehensive input validation**
3. **Add audit logging and monitoring**
4. **Create automated testing suite**

### Medium-term (Week 4-6)
1. **AWS infrastructure deployment**
2. **Performance optimization and caching**
3. **Complete integration testing**
4. **Security penetration testing**

### Pre-launch (Week 6-8)
1. **User acceptance testing**
2. **Documentation completion**
3. **Training materials creation**
4. **Gradual rollout planning**

---

## Success Metrics

### Technical Success Criteria
- ✅ 100% real authentication (no demo code)
- ✅ 100% data persistence (no in-memory storage)
- ✅ Security audit passed
- ✅ 70%+ test coverage
- ✅ Performance benchmarks met
- ✅ Zero critical vulnerabilities

### Business Success Criteria
- ✅ All user roles can access appropriate functionality
- ✅ Complete deal workflow from submission to signature
- ✅ Approval process efficiency improved by 50%+
- ✅ Deal processing time reduced by 30%+
- ✅ User adoption rate >80% within first month

---

## Support & Maintenance

### Key Contacts
- **Van Ngo** - Business Owner and Requirements
- **Anthony** - Database and Infrastructure  
- **IT Team** - Okta SSO and Corporate Integration
- **Security Team** - Compliance and Security Review

### Documentation Updates
This master document should be updated whenever:
- Schema changes are made
- New features are added
- Security configurations change
- Integration points are modified
- Business workflow updates

### Version History
- **v1.0** - Initial development version (Replit/demo)
- **v2.0** - Production-ready version (with security and Databricks)

---

*This document serves as the single source of truth for the Deal Desk application. All other documentation has been consolidated into this master reference.*

**Last Updated:** August 22, 2025  
**Next Review:** Post-production deployment