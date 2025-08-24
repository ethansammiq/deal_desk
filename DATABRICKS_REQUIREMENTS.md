# Databricks Requirements for Deal Desk Application

**Purpose:** Define exactly what's needed from Databricks to make Deal Desk production-ready  
**For:** Anthony Perez (Databricks Admin)  
**From:** Ethan & Van  
**Date:** August 2025

---

## 🎯 What We Need

### **A Test Database Environment**

We need a dedicated space in Databricks where we can:

- Create and modify tables during development
- Test our data persistence layer
- Load sample data for testing
- **Suggested name:** `deal_desk_test`

### **10 Core Tables**

| Table | Purpose | Key Data |
|-------|---------|----------|
| **users** | Store MiQ employee info from Okta SSO | Roles, departments, email |
| **deals** | Track all deal submissions | 30+ fields for deal details |
| **deal_approvals** | Multi-stage approval workflow | Who needs to approve what |
| **deal_tiers** | Tiered pricing structures | Revenue, margins, incentives |
| **deal_status_history** | Audit trail of all changes | Who changed what and when |
| **advertisers** | Client company info | Historical revenue data |
| **agencies** | Agency partner info | Type, region, revenue |
| **deal_scoping_requests** | Pre-deal exploratory requests | Convert to formal deals |
| **approval_actions** | Individual approval decisions | Comments, timestamps |
| **incentive_values** | Track deal incentives | Categories, values, notes |

---

## 🔐 Access & Security

### **What We Need Access To:**

- **Development:** Read/write to test database
- **Production:** Service account with limited permissions
- **Connection:** Azure AD token authentication
- **Security:** SSL/TLS encrypted connections

### **What We DON'T Need:**

- ❌ Direct access to production tables
- ❌ Ability to run ad-hoc queries
- ❌ Access to other MiQ data
- ❌ Admin privileges

---

## 📊 Data Volume Expectations

- **Monthly:** ~500-1000 new deals
- **Users:** ~200-500 active employees
- **Storage:** ~1-2GB initially, growing to ~10-20GB/year
- **Performance:** Sub-second response for dashboard queries

---

## 🚨 Why This Is Critical

**Current Problem:** All data is stored in memory only

- 💥 **Server restart = all data lost**
- 📉 **Can't scale beyond single server**
- 🔒 **No backup or recovery possible**

**With Databricks:**

- ✅ Data persists permanently
- ✅ Multiple users can access simultaneously
- ✅ Automatic backups and recovery
- ✅ Proper audit trails for compliance

---

## 🏗️ Implementation Plan

### **Phase 1: Setup (What we need from you)**

1. Create test database: `deal_desk_test`
2. Grant our service account basic permissions:

   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE 
   ON DATABASE deal_desk_test 
   TO [deal_desk_service_account]
   ```

3. Provide connection details (server, auth token)

### **Phase 2: Migration (What we'll do)**

1. Create tables using provided schema
2. Test connection from application
3. Migrate from in-memory to Databricks
4. Validate data persistence

### **Phase 3: Production (Future)**

1. Create production database: `deal_desk_prod`
2. Set up automated backups
3. Configure monitoring

---

## 📋 Quick Action Items for Anthony

**This Week:**

- [ ] Provision test database space
- [ ] Create service account for Deal Desk
- [ ] Share connection details with team

**Next Week:**

- [ ] Review table schema together
- [ ] Test initial connection
- [ ] Plan production setup

---

## 💬 Contact

**Questions?** Reach out to Ethan or Van  
**Urgent?** This blocks our production launch - data loss risk is critical

---

*Note: We already have the complete SQL schema ready (from code review). We just need the database space and permissions to implement it.*
