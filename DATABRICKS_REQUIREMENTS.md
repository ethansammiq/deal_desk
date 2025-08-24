# Databricks Requirements - Deal Desk Project

**To:** Anthony Perez, VP Innovation & Growth Programs  
**From:** Van Ngo, RVP Trading Northeast & Ethan Sam  
**Re:** Database Infrastructure for Deal Desk Application  
**Date:** August 2025

---

## Project Context

Van Ngo is leading the development of a Deal Desk application to streamline MiQ's commercial deal approval process. The application is functionally complete and ready for production, but requires persistent data storage to replace the current in-memory system.

**Business Problem Being Solved:**

- Manual deal approval processes causing 5-7 day delays
- No visibility into deal pipeline or approval bottlenecks  
- Lost revenue opportunities due to slow response times
- Lack of audit trail for multi-million dollar deal decisions

**Current Technical Challenge:**
The application loses all data when the server restarts. This is blocking our production launch and preventing Van's team from using the system for real deals.

---

## What We Need From Databricks

### 1. Test Environment Access

We need a dedicated database space where our development team can:

- Build and test the data persistence layer
- Migrate from in-memory to persistent storage
- Validate the application before production deployment

**Suggested Database Name:** `deal_desk_test`

### 2. Database Schema Requirements

The application requires 10 core tables to support the deal workflow:

| Table Name | Business Purpose | Expected Volume |
|------------|------------------|-----------------|
| **users** | Store MiQ employee data from Okta SSO | ~500 users |
| **deals** | Track all commercial deals through approval | ~1000/month |
| **deal_approvals** | Multi-stage approval workflow tracking | ~5000/month |
| **deal_tiers** | Tiered pricing and margin structures | ~3000/month |
| **deal_status_history** | Complete audit trail for compliance | ~10000/month |
| **advertisers** | Client company information | ~2000 records |
| **agencies** | Agency partner data | ~500 records |
| **deal_scoping_requests** | Pre-deal opportunity assessment | ~200/month |
| **approval_actions** | Individual approval decisions and comments | ~5000/month |
| **incentive_values** | Deal incentives and special terms | ~2000/month |

### 3. Access Requirements

**Development Phase:**

- Service account with read/write permissions to test database
- Azure AD token-based authentication
- SSL/TLS encrypted connections

**Production Phase (Future):**

- Separate production database (`deal_desk_prod`)
- Restricted service account (no direct table access)
- Automated backup configuration

---

## Business Impact & Urgency

### Why This Is Critical

**Without Databricks:**

- **Data Loss Risk:** Any server restart loses all deals in progress
- **Revenue Impact:** Unable to track ~$50M+ in monthly deal flow
- **Compliance Risk:** No audit trail for SOX compliance requirements
- **Team Impact:** 200+ sellers cannot use the system

**With Databricks:**

- Persistent storage for all deal data
- Real-time visibility into $600M+ annual pipeline
- Complete audit trail for compliance
- Foundation for AI-driven deal insights and analytics

### Growth & Innovation Opportunities

Once the core database is operational, this infrastructure will enable:

- Predictive analytics on deal success rates
- ML models for optimal pricing recommendations
- Integration with broader MiQ analytics ecosystem
- Data-driven insights for Van's growth programs

---

## Implementation Approach

### Phase 1: Foundation (Immediate Need)

**What we need from you this week:**

1. Provision test database space (`deal_desk_test`)
2. Create service account with basic permissions
3. Share connection details (server, authentication token)

### Phase 2: Development (Weeks 2-3)

**What our team will handle:**

- Create tables using provided schema
- Migrate application from in-memory to Databricks
- Test with Van's team using real deal scenarios

### Phase 3: Production (Weeks 4-6)

**Joint effort:**

- Set up production environment
- Configure monitoring and backups
- Gradual rollout to sales teams

---

## Specific Requirements

### Technical Specifications

- **Database Type:** SQL Server compatible (T-SQL syntax)
- **Connection Method:** Azure AD token authentication
- **Expected Load:** ~1000 concurrent users, ~10K transactions/day
- **Performance Target:** <500ms query response time
- **Data Retention:** 7 years for audit compliance

### Security & Compliance

- Row-level security based on user roles
- Encrypted data at rest and in transit
- No direct production table access
- Full audit logging for all modifications

---

## Action Items for Anthony

### This Week (Critical Path)

- [ ] Approve test database provisioning
- [ ] Assign resources for database setup
- [ ] Schedule technical handoff meeting

### Specific Deliverables Needed

1. **Connection String** for test environment
2. **Service Account Credentials** with appropriate permissions
3. **Technical Contact** for troubleshooting

---

## Success Metrics

We'll measure success through:

- **Technical:** Zero data loss events, <500ms response times
- **Business:** 50% reduction in deal approval time
- **User Adoption:** 200+ active users within 30 days
- **Revenue Impact:** Improved visibility on $600M+ pipeline

---

## Questions for Discussion

1. Can we leverage existing Databricks infrastructure or need new provisioning?
2. What's the standard process for promoting from test to production?
3. Who should be the technical point of contact for integration issues?

---

**Next Steps:** Please confirm receipt and let us know your availability for a technical planning session this week. Van's team is ready to move forward as soon as we have database access.

**Contact:**

- Van Ngo (Business Requirements): <van.ngo@miq.com>
- Ethan Sam (Technical Integration): <ethan.sam@miq.com>
