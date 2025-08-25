# Databricks Infrastructure Requirements - Deal Desk Project

**To:** Anthony Perez, VP Innovation & Growth Programs  
**From:** Ethan Sam, Growth & Innovation Associate  
**Re:** Database Infrastructure for Trading Department Deal Desk Solution  
**Date:** August 2025  
**Timeline:** 6-8 weeks total development

---

## 📋 Executive Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT STATUS DASHBOARD                 │
├─────────────────────────────────────────────────────────────┤
│ Business Sponsor: Van Ngo (RVP Trading, Northeast)          │
│ Technical Lead:   Ethan Sam (Growth & Innovation)           │
│ Infrastructure:   Anthony Perez (VP Innovation & Growth)    │
│ Timeline:         6-8 weeks total development               │
│ Current Status:   ⚠️  Blocked - Awaiting Database Setup     |
│ Risk Level:       🔴 HIGH - Data loss prevents production   │
└─────────────────────────────────────────────────────────────┘
```

**The Challenge:** Van's Trading Department needs a Deal Desk application to streamline commercial deal approvals, but we're blocked by data persistence requirements. Current in-memory storage loses all data on server restart.

**The Ask:** Databricks infrastructure setup to enable persistent data storage for production deployment.

---

## 🎯 Project Team & Organizational Structure

```
Innovation & Growth Programs (Anthony Perez, VP)
├── Ethan Sam (Growth & Innovation Associate)
│   └── Technical implementation & database migration
│
Trading Department (Separate)
├── Van Ngo (RVP Trading, Northeast) 
│   └── Business requirements & user acceptance
│
Collaboration Model: Cross-departmental support
```

**Team Responsibilities:**

| Team Member | Department | Role | Key Deliverables |
|-------------|------------|------|------------------|
| **Anthony Perez** | Innovation & Growth | Strategic oversight | Databricks provisioning, architecture decisions |
| **Ethan Sam** | Innovation & Growth | Technical lead | Database implementation, app migration |
| **Van Ngo** | Trading | Business owner | Requirements, testing, trading team rollout |

---

## 📊 Current State Analysis

### Technical Problem

**Current Architecture:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │◄──►│   Express   │◄──►│ MemStorage  │
│  Frontend   │    │   Server    │    │ (In-Memory) │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                      💥 Data Lost 
                                       on Restart
```

**Target Architecture:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │◄──►│   Express   │◄──►│ Databricks │
│  Frontend   │    │   Server    │    │ Persistent  │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                       ✅ Data Safely 
                                          Persisted
```

### Business Impact Metrics

**From businessConstants.ts (lines 24-29):**
```
Approval Thresholds Currently Configured:
├── Manager Level:    $50,000
├── Director Level:   $100,000  
├── VP Level:         $500,000
└── SVP Level:        $1,000,000
```

**Trading Department Impact:**
- **Current State:** Manual approval processes, no pipeline visibility
- **Risk:** Data loss prevents tracking deals through these approval tiers
- **Opportunity:** Streamlined workflow for Van's Northeast Trading team

---

## 🔄 Technical Requirements

### Database Schema Overview

```
Deal Desk Database Architecture
├── 👤 users (Okta SSO integration)
├── 💼 deals (Core deal tracking)  
├── ✅ deal_approvals (Multi-stage workflow)
├── 📊 deal_tiers (Pricing structures)
├── 📝 deal_status_history (Audit trail)
├── 🏢 advertisers (Client data)
├── 🎯 agencies (Partner data)
├── 🔍 deal_scoping_requests (Pre-deal assessment)
├── ⚡ approval_actions (Individual decisions)
└── 💰 incentive_values (Special terms)
```

### Expected Data Volumes

| Table | Business Purpose | Monthly Volume | Storage Est. |
|-------|------------------|----------------|--------------|
| deals | Deal submissions | ~500-1000 | Primary workload |
| deal_approvals | Approval tracking | ~2000-5000 | High activity |
| deal_status_history | Audit trail | ~5000-10000 | Compliance req'd |
| users | Trading team members | ~200-500 | Steady state |
| Others | Supporting data | ~1000-3000 | Reference tables |

### Technical Specifications

**From system configuration:**
- **Default Margin:** 35% (businessConstants.ts:13)
- **Max Tiers per Deal:** 5 (businessConstants.ts:8)
- **Contract Term Default:** 12 months (businessConstants.ts:14)
- **Database Type:** SQL Server compatible (T-SQL syntax)
- **Authentication:** Azure AD token-based
- **Performance Target:** <500ms query response

---

## 📈 Development Timeline (6-8 Weeks)

```
Project Timeline - Deal Desk Database Implementation

Week 1-2: Infrastructure Setup
├── Anthony: Databricks environment provisioning
├── Ethan: Service account configuration
└── 🎯 Milestone: Database connection established

Week 3-4: Implementation
├── Ethan: Schema creation & data migration
├── Ethan: Application integration testing
└── 🎯 Milestone: App running on persistent storage

Week 5-6: Business Validation  
├── Van: Trading workflow testing
├── Ethan: Performance optimization
└── 🎯 Milestone: User acceptance complete

Week 7-8: Production Deployment
├── Anthony: Production environment setup
├── Van: Trading team rollout
└── 🎯 Milestone: Live production system

Status: ⏳ Currently blocked at Week 1 - awaiting database setup
```

---

## 🤝 Infrastructure Decision Points

**Anthony - Strategic Architecture Decisions Needed:**

### Option A: Shared Environment
```
Pros: ✅ Faster setup, shared resources
Cons: ❌ Potential conflicts, limited isolation
Cost: $ Lower
Timeline: 1-2 weeks setup
```

### Option B: Dedicated Environment  
```
Pros: ✅ Full control, performance isolation
Cons: ❌ More setup time, dedicated resources
Cost: $$$ Higher
Timeline: 2-3 weeks setup
```

### Option C: Staged Approach
```
Pros: ✅ Test in shared, production dedicated
Cons: ❌ Two-phase migration
Cost: $$ Moderate
Timeline: 2-4 weeks total
```

**Recommendation:** Option C (Staged) - Start with shared test environment, migrate to dedicated production.

---

## 💡 Success Framework

### Technical KPIs
```
┌─────────────────────────────────────────────┐
│              SUCCESS METRICS                │
├─────────────────────────────────────────────┤
│ Data Persistence:    ✅ Zero data loss      │
│ Response Time:       ✅ <500ms queries      │  
│ Concurrent Users:    ✅ 200+ supported      │
│ Uptime:             ✅ 99.9% availability   │
│ Audit Trail:        ✅ Complete history     │
└─────────────────────────────────────────────┘
```

### Business Success Metrics
- **Trading Team Adoption:** 50+ users within 30 days
- **Approval Efficiency:** Reduce cycle time by 40%
- **Pipeline Visibility:** Real-time tracking across all approval tiers
- **Compliance:** Complete audit trail for regulatory requirements

---

## 🚀 Immediate Action Items

### This Week (Critical Path - Ethan & Anthony)

**Anthony's Decisions Needed:**
- [ ] Choose environment approach (A, B, or C above)
- [ ] Approve test database provisioning  
- [ ] Assign technical contact for setup coordination

**Ethan's Deliverables:**
- [ ] Provide detailed schema DDL scripts
- [ ] Document connection requirements
- [ ] Create migration testing plan

### Next Week

**Joint Activities:**
- [ ] Database environment validation
- [ ] Initial connection testing
- [ ] Schema deployment verification

---

## 🔧 Technical Specifications Detail

### Connection Requirements
```
Database Configuration Needed:
├── Server: [TBD - Anthony to provide]
├── Database: deal_desk_test (initial)
├── Auth: Azure AD service account
├── Permissions: CREATE, SELECT, INSERT, UPDATE, DELETE
├── SSL: Required (TLS 1.2+)
└── Pooling: Connection pool size: 10-20
```

### Service Account Setup
- **Account Name:** `svc-dealdesk-prod` 
- **Permissions:** Read/write to designated schema only
- **Rotation:** Standard MiQ security policy compliance
- **Monitoring:** Query performance and access logging

---

## 📞 Coordination & Communication

**Immediate Team Sync Needed:**
- **Anthony & Ethan:** Technical architecture review (30 min)
- **Van & Ethan:** Business validation planning (30 min)  
- **All Three:** Weekly status check-ins during 6-8 week timeline

**Questions for Discussion:**
1. Which environment approach fits Innovation & Growth Programs strategy?
2. Any existing Databricks infrastructure we can leverage?
3. Standard process for promoting test → production in our department?

---

## 📋 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Loss | 🔴 HIGH | Immediate database setup |
| Performance | 🟡 MEDIUM | Load testing in week 4-5 |
| Integration | 🟡 MEDIUM | Parallel development streams |
| Trading Team Adoption | 🟠 MEDIUM | Van's change management plan |

---

**Next Steps:** Anthony, please review the environment options above and let's schedule a brief technical planning session. Van's trading team is ready to validate the solution as soon as we have persistent storage.

**Internal Contacts:**
- **Ethan Sam** (Technical): <ethan.sam@miq.com>
- **Van Ngo** (Business): <van.ngo@miq.com>
