# Permission System Guide

## Overview
This guide explains the role-based permission system, status transitions, and dashboard access for each user role in the deal management platform.

## Role Definitions and Permissions

### 1. **Seller** 
**Primary Function**: Deal creation and initial submission
**Permissions**:
- ✅ **View Deals**: Can view their own deals only
- ✅ **Create Deals**: Can create new deals and scoping requests
- ✅ **Edit Deals**: Can edit their own deals (before submission)
- ❌ **Delete Deals**: Cannot delete deals
- ❌ **View All Deals**: Limited to their own deals only
- ❌ **Approve Deals**: Cannot approve deals
- ❌ **Legal Review**: No access to legal functions
- ❌ **Manage Contracts**: No contract management access

**Status Transitions**: `scoping` → `submitted`
**Dashboard Access**: 3 sections (deals, scoping, performance)

### 2. **Department Reviewer** 
**Primary Function**: Technical validation and department-specific approval
**Permissions**:
- ✅ **View Deals**: Can view deals assigned to their department
- ❌ **Create Deals**: Cannot create new deals
- ❌ **Edit Deals**: Cannot directly edit deals (read-only)
- ❌ **Delete Deals**: Cannot delete deals
- ✅ **View All Deals**: Can view deals across departments (filtered by relevance)
- ✅ **Approve Deals**: Can approve within their technical expertise
- ❌ **Legal Review**: No access to legal functions
- ❌ **Manage Contracts**: No contract management access

**Status Transitions**: `approved`, `revision_requested`
**Dashboard Access**: 3 sections (department-approvals, deals, workload)

### 3. **Approver** 
**Primary Function**: Business decision-making and strategic approval
**Permissions**:
- ✅ **View Deals**: Can view all deals in the system
- ❌ **Create Deals**: Cannot create new deals
- ❌ **Edit Deals**: Cannot directly edit deals - **must request revisions instead**
- ❌ **Delete Deals**: Cannot delete deals
- ✅ **View All Deals**: Full visibility across all deals
- ✅ **Approve Deals**: Can make business approval decisions
- ❌ **Legal Review**: No access to legal functions
- ❌ **Manage Contracts**: No contract management access

**Status Transitions**: `under_review`, `negotiating`, `approved`, `revision_requested`, `lost`
**Dashboard Access**: 4 sections (deals, approvals, analytics, reports)

### 4. **Legal** 
**Primary Function**: Legal review and contract management
**Permissions**:
- ✅ **View Deals**: Can view all deals for legal assessment
- ❌ **Create Deals**: Cannot create new deals
- ❌ **Edit Deals**: Cannot edit deal details (read-only for deals)
- ❌ **Delete Deals**: Cannot delete deals
- ✅ **View All Deals**: Full visibility for legal compliance
- ❌ **Approve Deals**: Cannot make business approvals
- ✅ **Legal Review**: Full access to legal review functions
- ✅ **Manage Contracts**: Can create, edit, and manage contracts

**Status Transitions**: `contract_drafting`, `client_review`, `signed`
**Dashboard Access**: 3 sections (legal-queue, contracts, compliance)

### 5. **Admin** 
**Primary Function**: System administration and oversight
**Permissions**:
- ✅ **View Deals**: Full system access
- ✅ **Create Deals**: Can create deals (admin override)
- ✅ **Edit Deals**: Can edit any deal (admin override)
- ✅ **Delete Deals**: Can delete deals (admin function)
- ✅ **View All Deals**: Complete system visibility
- ✅ **Approve Deals**: Can approve deals (admin override)
- ✅ **Legal Review**: Full access to legal functions
- ✅ **Manage Contracts**: Full contract management access

**Status Transitions**: All status transitions allowed
**Dashboard Access**: 14 sections (complete system access)

## Key Permission Distinctions

### **"View Deals" vs "View All Deals"**
- **View Deals**: Basic permission to see deal information
- **View All Deals**: Permission to see deals beyond your own/department scope
  - Sellers: Only their own deals
  - Department Reviewers: Deals relevant to their department + system visibility
  - Approvers/Legal/Admin: All deals in the system

### **Edit vs Revision Request System**
**Important Change**: Approvers can no longer directly edit deals. Instead, they must:
1. Request revisions with specific feedback
2. Change deal status to `revision_requested`
3. Add comments explaining what needs to be changed
4. Seller receives the revision request and makes the edits
5. Deal returns to review workflow

This ensures:
- Clear audit trail of who made what changes
- Seller ownership of deal content
- Proper validation workflow

## Status Transition System

### **How Status Transitions Work**
Each role can only transition deals to specific statuses based on their responsibilities:

```
Draft → Scoping → Submitted → Under Review → [Approved/Revision Requested/Lost]
                                    ↓
                              [If Approved] → Contract Drafting → Client Review → Signed
```

### **Role-Based Transition Rules**
- **Seller**: Can move deals from `scoping` to `submitted`
- **Department Reviewer**: Can `approve` or request `revision_requested`
- **Approver**: Can move through business approval stages
- **Legal**: Can manage contract and legal stages
- **Admin**: Can override any transition (system administration)

### **Status Transition Testing**
The "Status Transitions" tab in the testing interface shows:
1. **Current Deal Status**: The starting point
2. **Allowed Transitions**: What statuses your role can change this deal to
3. **Real-time Validation**: Live checking against your current role

**How to Use**:
1. Look at a deal status (e.g., "under_review")
2. See what transitions are allowed for your role
3. Test actual transitions using the workflow testing tab

## Dashboard Access by Role

### **Dashboard Sections Explained**
- **Deals**: General deal viewing and management
- **Scoping**: Scoping request management (seller focus)
- **Approvals**: Approval queue management (approver/reviewer focus)
- **Legal Queue**: Legal review queue (legal focus)
- **Analytics/Reports**: Business intelligence and reporting
- **Admin Panel**: System administration tools
- **Performance**: Individual/team performance metrics

### **Section Count by Role**
- Seller: 3 sections (focused workflow)
- Department Reviewer: 3 sections (department-specific)
- Approver: 4 sections (business oversight)
- Legal: 3 sections (legal-specific)
- Admin: 14 sections (complete system access)

## Testing and Validation

### **Using the Testing Interface**
1. **Role Testing Tab**: Switch between roles to see permission changes
2. **Permission Matrix Tab**: Compare all roles side-by-side
3. **Status Transitions Tab**: See what transitions your current role allows
4. **Workflow Testing Tab**: Test real actions with live data

### **Common Testing Scenarios**
1. Switch to Approver role → Try to edit a deal → Should be blocked
2. Switch to Seller role → Try to approve a deal → Should be blocked
3. Test revision request workflow from Approver perspective
4. Verify department reviewer scope limitations

## Best Practices

### **For Approvers**
- Use revision requests instead of direct edits
- Provide clear, specific feedback in revision comments
- Use status changes to communicate workflow progression

### **For Department Reviewers**
- Focus on technical validation within your expertise
- Use approval/revision options appropriately
- Coordinate with business approvers for complex decisions

### **For Sellers**
- Ensure deal information is complete before submission
- Respond promptly to revision requests
- Use scoping → submitted workflow appropriately

### **For System Testing**
- Always test permission boundaries
- Verify status transition rules work correctly
- Validate role switching functionality in development