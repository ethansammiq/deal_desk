/**
 * Seed script for approval departments
 * Sets up the 6 departments for the multi-layered approval system
 */

import { db } from "./storage";
import { approvalDepartments } from "@shared/schema";

const departmentData = [
  {
    departmentName: "finance" as const,
    displayName: "Finance Team",
    description: "Reviews financial incentives and overall deal viability",
    contactEmail: "finance-team@company.com",
    incentiveTypes: ["financial_incentive", "payment_terms", "credit_terms", "budget_allocation"]
  },
  {
    departmentName: "trading" as const,
    displayName: "Trading Team", 
    description: "Reviews margin implications and trading viability",
    contactEmail: "trading-team@company.com",
    incentiveTypes: ["margin_optimization", "trading_terms", "volume_commitments"]
  },
  {
    departmentName: "creative" as const,
    displayName: "Creative Team",
    description: "Reviews creative and marketing incentives",
    contactEmail: "creative-team@company.com", 
    incentiveTypes: ["creative_incentive", "marketing_support", "brand_exposure", "co_marketing"]
  },
  {
    departmentName: "marketing" as const,
    displayName: "Marketing Team",
    description: "Reviews marketing strategy and promotional incentives",
    contactEmail: "marketing-team@company.com",
    incentiveTypes: ["promotional_support", "campaign_incentives", "media_benefits", "marketing_tools"]
  },
  {
    departmentName: "product" as const,
    displayName: "Product Team", 
    description: "Reviews product-related incentives and offerings",
    contactEmail: "product-team@company.com",
    incentiveTypes: ["product_incentive", "feature_access", "product_discount", "beta_access"]
  },
  {
    departmentName: "solutions" as const,
    displayName: "Solutions Team",
    description: "Reviews technical solutions and implementation incentives", 
    contactEmail: "solutions-team@company.com",
    incentiveTypes: ["technical_support", "implementation_services", "consulting_hours", "training_programs"]
  }
];

export async function seedApprovalDepartments() {
  try {
    console.log("Seeding approval departments...");
    
    for (const dept of departmentData) {
      await db.insert(approvalDepartments)
        .values(dept)
        .onConflictDoUpdate({
          target: approvalDepartments.departmentName,
          set: {
            displayName: dept.displayName,
            description: dept.description,
            contactEmail: dept.contactEmail,
            incentiveTypes: dept.incentiveTypes,
            updatedAt: new Date()
          }
        });
      
      console.log(`✓ Seeded department: ${dept.displayName}`);
    }
    
    console.log("Approval departments seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding approval departments:", error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  seedApprovalDepartments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}