import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronRight, DollarSign, BarChart, BriefcaseBusiness, Lightbulb, LayoutGrid, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Define incentive data structure
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
  value: number;
  notes: string;
  tierIds: number[]; // Array of tier IDs this incentive applies to
}

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

export function IncentiveSelector({
  selectedIncentives = [],
  dealTiers = [],
  onChange
}: {
  selectedIncentives: SelectedIncentive[];
  dealTiers: Array<{tierNumber: number, [key: string]: any}>;
  onChange: (incentives: SelectedIncentive[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  
  // Temporary state for creating a new incentive
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempSubCategory, setTempSubCategory] = useState<string | null>(null);
  const [tempOption, setTempOption] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  
  // Track tier-specific values
  const [tierValues, setTierValues] = useState<TierIncentiveValue[]>([]);

  // Find currently selected category and subcategory
  const currentCategory = incentiveCategories.find(c => c.id === activeCategory);
  const currentSubCategory = currentCategory?.subCategories.find(s => s.id === activeSubCategory);
  
  // Available tiers from props
  const availableTiers = dealTiers.map(tier => tier.tierNumber);

  // Handle adding a new incentive
  const handleAddIncentive = () => {
    if (tempCategory && tempSubCategory && tempOption && tierValues.length > 0) {
      const newIncentive: SelectedIncentive = {
        categoryId: tempCategory,
        subCategoryId: tempSubCategory,
        option: tempOption,
        notes: tempNotes || '',
        tierValues: tierValues
      };
      
      onChange([...selectedIncentives, newIncentive]);
      
      // Reset temporary state
      setTempCategory(null);
      setTempSubCategory(null);
      setTempOption(null);
      setTempNotes('');
      setTierValues([]);
      setActiveCategory(null);
      setActiveSubCategory(null);
    }
  };

  // Handle removing an incentive
  const handleRemoveIncentive = (index: number) => {
    const newIncentives = [...selectedIncentives];
    newIncentives.splice(index, 1);
    onChange(newIncentives);
  };

  // Get display information for an incentive
  const getIncentiveInfo = (incentive: SelectedIncentive) => {
    const category = incentiveCategories.find(c => c.id === incentive.categoryId);
    const subCategory = category?.subCategories.find(s => s.id === incentive.subCategoryId);
    
    return {
      categoryName: category?.name || '',
      subCategoryName: subCategory?.name || '',
      icon: category?.icon || <Plus className="h-4 w-4" />
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Incentive Values</h3>
      
      {/* Display selected incentives */}
      {selectedIncentives.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Selected Incentives</h4>
          <div className="space-y-2">
            {selectedIncentives.map((incentive, index) => {
              const info = getIncentiveInfo(incentive);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                      {info.icon}
                    </div>
                    <div>
                      <div className="font-medium">{incentive.option}</div>
                      <div className="text-sm text-gray-500">
                        {info.categoryName} <ChevronRight className="inline h-3 w-3" /> {info.subCategoryName}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {incentive.tierIds.map(tierId => (
                          <Badge key={tierId} variant="secondary" className="text-xs">
                            Tier {tierId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="font-medium">
                      {typeof incentive.value === 'number' ? 
                        (incentive.value > 999 ? 
                          `$${(incentive.value/1000).toFixed(1)}k` : 
                          `$${incentive.value}`) : 
                        '—'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIncentive(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Incentive selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Incentive</CardTitle>
          <CardDescription>
            Select a category, sub-category, and specific incentive option
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Choose Category */}
          <div className="space-y-2">
            <Label>1. Select Incentive Category</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {incentiveCategories.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="flex items-center justify-start p-2 h-auto"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setActiveSubCategory(null);
                    setTempIncentive({
                      ...tempIncentive,
                      categoryId: category.id,
                      subCategoryId: undefined,
                      option: undefined
                    });
                  }}
                >
                  <div className="mr-2">{category.icon}</div>
                  <div className="text-left text-sm">{category.name}</div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Step 2: Choose Sub-Category (if category is selected) */}
          {activeCategory && (
            <div className="space-y-2">
              <Label>2. Select Sub-Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {currentCategory?.subCategories.map(subCategory => (
                  <Button
                    key={subCategory.id}
                    variant={activeSubCategory === subCategory.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => {
                      setActiveSubCategory(subCategory.id);
                      setTempIncentive({
                        ...tempIncentive,
                        subCategoryId: subCategory.id,
                        option: undefined
                      });
                    }}
                  >
                    {subCategory.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Choose specific option (if sub-category is selected) */}
          {activeSubCategory && (
            <div className="space-y-2">
              <Label>3. Select Specific Incentive</Label>
              <Select
                value={tempIncentive.option}
                onValueChange={(value) => setTempIncentive({
                  ...tempIncentive,
                  option: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an incentive option" />
                </SelectTrigger>
                <SelectContent>
                  {currentSubCategory?.options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Step 4: Enter value and notes (if option is selected) */}
          {tempIncentive.option && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>4. Enter Incentive Value (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-8"
                    value={tempIncentive.value || ''}
                    onChange={(e) => setTempIncentive({
                      ...tempIncentive,
                      value: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional details about this incentive..."
                  value={tempIncentive.notes || ''}
                  onChange={(e) => setTempIncentive({
                    ...tempIncentive,
                    notes: e.target.value
                  })}
                />
              </div>
              
              {/* Step 5: Select which tiers this incentive applies to */}
              <div className="space-y-2 pt-2">
                <Label>5. Apply to Tiers</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTiers.map(tierId => (
                    <Button
                      key={tierId}
                      type="button"
                      variant={(tempIncentive.tierIds || []).includes(tierId) ? "default" : "outline"}
                      onClick={() => {
                        const currentTierIds = tempIncentive.tierIds || [];
                        let newTierIds: number[];
                        
                        if (currentTierIds.includes(tierId)) {
                          // Remove tier if already selected
                          newTierIds = currentTierIds.filter(id => id !== tierId);
                        } else {
                          // Add tier if not already selected
                          newTierIds = [...currentTierIds, tierId];
                        }
                        
                        setTempIncentive({
                          ...tempIncentive,
                          tierIds: newTierIds
                        });
                      }}
                    >
                      Tier {tierId}
                    </Button>
                  ))}
                </div>
                {(!tempIncentive.tierIds || tempIncentive.tierIds.length === 0) && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one tier</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setTempIncentive({});
              setActiveCategory(null);
              setActiveSubCategory(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={
              !tempIncentive.categoryId || 
              !tempIncentive.subCategoryId || 
              !tempIncentive.option || 
              !tempIncentive.tierIds || 
              tempIncentive.tierIds.length === 0
            }
            onClick={handleAddIncentive}
          >
            Add Incentive
          </Button>
        </CardFooter>
      </Card>
      
      {/* Incentives Categories Reference */}
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="categories-info">
          <AccordionTrigger className="text-sm">View All Incentive Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-2">
              {incentiveCategories.map(category => (
                <div key={category.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center mb-2">
                    <div className="bg-primary/10 p-1.5 rounded-md text-primary mr-2">
                      {category.icon}
                    </div>
                    <h4 className="font-medium">{category.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.subCategories.map(subCategory => (
                      <div key={subCategory.id} className="text-sm">
                        <p className="font-medium text-gray-800">{subCategory.name}</p>
                        <ul className="list-disc list-inside pl-2 text-gray-600 text-xs">
                          {subCategory.options.map(option => (
                            <li key={option}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}