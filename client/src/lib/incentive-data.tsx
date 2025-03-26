import { DollarSign, BriefcaseBusiness, Lightbulb, LayoutGrid, BarChart, Megaphone } from "lucide-react";
import React from "react";

export interface IncentiveSubCategory {
  id: string;
  name: string;
  options: string[];
}

export interface IncentiveCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  subCategories: IncentiveSubCategory[];
}

export interface SelectedIncentive {
  categoryId: string;
  subCategoryId: string;
  option: string;
  tierValues: { [tierId: number]: number }; // Map of tier IDs to values
  notes: string;
  tierIds: number[]; // Array of tier IDs this incentive applies to
}

// Define all incentive categories available in the application
export const incentiveCategories: IncentiveCategory[] = [
  {
    id: "financial",
    name: "Financial",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Monetary incentives including rebates, discounts, and bonuses",
    subCategories: [
      {
        id: "fin-rebates",
        name: "Rebates",
        options: ["Annual Rebate", "Quarterly Rebate", "Performance-based Rebate", "Tiered Rebate"]
      },
      {
        id: "fin-discounts",
        name: "Discounts",
        options: ["Volume Discount", "Upfront Discount", "Loyalty Discount", "Early Payment Discount"]
      },
      {
        id: "fin-bonuses",
        name: "Bonuses",
        options: ["Growth Bonus", "Performance Bonus", "Target Achievement Bonus", "Innovation Bonus"]
      }
    ]
  },
  {
    id: "resources",
    name: "Resources",
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    description: "People and talent resources provided as incentives",
    subCategories: [
      {
        id: "res-staff",
        name: "Staff Resources",
        options: ["Account Management", "Strategy Support", "Implementation Team", "Dedicated Consultant"]
      },
      {
        id: "res-training",
        name: "Training",
        options: ["Custom Workshops", "Certification Programs", "Onboarding Support", "Advanced Training"]
      }
    ]
  },
  {
    id: "product-innovation",
    name: "Product & Innovation",
    icon: <Lightbulb className="h-5 w-5" />,
    description: "Access to product features and innovation initiatives",
    subCategories: [
      {
        id: "prod-features",
        name: "Product Features",
        options: ["Beta Access", "Premium Features", "Custom Development", "Integration Support"]
      },
      {
        id: "prod-innovation",
        name: "Innovation Programs",
        options: ["Innovation Lab Access", "Co-creation Projects", "Prototype Testing", "Research Participation"]
      }
    ]
  },
  {
    id: "technology",
    name: "Technology",
    icon: <LayoutGrid className="h-5 w-5" />,
    description: "Technology support and infrastructure incentives",
    subCategories: [
      {
        id: "tech-infra",
        name: "Infrastructure",
        options: ["Enhanced API Access", "Dedicated Environment", "Technical Support", "Custom Integrations"]
      },
      {
        id: "tech-data",
        name: "Data Services",
        options: ["Data Enrichment", "Custom Data Pipelines", "Storage Solutions", "Real-time Processing"]
      }
    ]
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: <BarChart className="h-5 w-5" />,
    description: "Analytics, insights, and reporting capabilities",
    subCategories: [
      {
        id: "analytics-reporting",
        name: "Custom Reporting",
        options: ["Executive Dashboards", "Custom Reports", "Advanced Analytics", "Predictive Modeling"]
      },
      {
        id: "analytics-insights",
        name: "Insights",
        options: ["Industry Benchmarks", "Competitive Analysis", "Trend Reports", "Strategic Recommendations"]
      }
    ]
  },
  {
    id: "marketing-ld",
    name: "Marketing & L&D",
    icon: <Megaphone className="h-5 w-5" />,
    description: "Marketing support and learning & development initiatives",
    subCategories: [
      {
        id: "marketing",
        name: "Marketing Support",
        options: ["Co-marketing", "PR Support", "Event Sponsorship", "Case Studies"]
      },
      {
        id: "learning",
        name: "Learning & Development",
        options: ["Custom Curriculum", "Executive Education", "Industry Certifications", "Knowledge Sharing"]
      }
    ]
  }
];

// Helper function to get display information for an incentive
export function getIncentiveInfo(incentive: SelectedIncentive) {
  const category = incentiveCategories.find(c => c.id === incentive.categoryId);
  const subCategory = category?.subCategories.find(s => s.id === incentive.subCategoryId);
  
  return {
    categoryName: category?.name || '',
    subCategoryName: subCategory?.name || '',
    icon: category?.icon || null,
    description: category?.description || ''
  };
}