import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { 
  incentiveCategories, 
  type SelectedIncentive,
  getIncentiveInfo as getIncentiveInfoFromData
} from "@/lib/incentive-data";

// Define temporary incentive type for state management
interface TempIncentive {
  categoryId?: string;
  subCategoryId?: string;
  option?: string;
  tierValues?: { [tierId: number]: number };
  notes?: string;
  tierIds?: number[];
}

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
  const [tempIncentive, setTempIncentive] = useState<TempIncentive>({});
  
  // Find currently selected category and subcategory
  const currentCategory = incentiveCategories.find(c => c.id === activeCategory);
  const currentSubCategory = currentCategory?.subCategories.find(s => s.id === activeSubCategory);
  
  // Available tiers from props
  const availableTiers = dealTiers.map(tier => tier.tierNumber);
  
  // Automatically select all tiers when an option is selected
  useEffect(() => {
    if (tempIncentive.option && availableTiers.length > 0) {
      setTempIncentive(prev => ({
        ...prev,
        tierIds: [...availableTiers]
      }));
    }
  }, [tempIncentive.option, availableTiers]);

  // Handle adding a new incentive
  const handleAddIncentive = () => {
    if (tempIncentive.categoryId && 
        tempIncentive.subCategoryId && 
        tempIncentive.option && 
        tempIncentive.tierIds && 
        tempIncentive.tierIds.length > 0) {
      
      const newIncentive: SelectedIncentive = {
        categoryId: tempIncentive.categoryId,
        subCategoryId: tempIncentive.subCategoryId,
        option: tempIncentive.option,
        tierValues: tempIncentive.tierValues || {},
        notes: tempIncentive.notes || '',
        tierIds: tempIncentive.tierIds
      };
      
      onChange([...selectedIncentives, newIncentive]);
      
      // Reset temporary state
      setTempIncentive({});
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
      {/* Heading is now in parent component */}
      
      {/* Display selected incentives as a table */}
      {selectedIncentives.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-500">Selected Incentives</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-slate-100 border border-slate-200 w-1/3"></th>
                  <th className="text-center p-3 bg-slate-100 border border-slate-200 w-10">Actions</th>
                  {availableTiers.map(tierId => (
                    <th key={tierId} className="text-center p-3 bg-slate-100 border border-slate-200 w-1/5">
                      <div className="flex justify-between items-center">
                        <span className="flex-1">Tier {tierId}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedIncentives.map((incentive, index) => {
                  const info = getIncentiveInfo(incentive);
                  
                  return (
                    <tr key={index} className="border border-slate-200">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="bg-primary/10 p-1 rounded-md text-primary hidden md:block">
                            {info.icon}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{incentive.option}</div>
                            <div className="text-xs text-gray-500">
                              {info.categoryName} → {info.subCategoryName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIncentive(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                      {availableTiers.map(tierId => (
                        <td key={tierId} className="p-3 text-center text-sm font-medium">
                          {incentive.tierValues && incentive.tierValues[tierId] ? 
                            `$${incentive.tierValues[tierId].toLocaleString()}` : 
                            '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          
          {/* Step 4: Configure incentive by tier */}
          {tempIncentive.option && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>4. Configure Incentive by Tier</Label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-3 bg-slate-100 border border-slate-200 w-1/3"></th>
                        {availableTiers.map(tierId => (
                          <th key={tierId} className="text-center p-3 bg-slate-100 border border-slate-200 w-1/5">
                            <div className="flex justify-between items-center">
                              <span className="flex-1">Tier {tierId}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Incentive Value Row */}
                      <tr>
                        <td className="font-medium p-3 border border-slate-200 bg-slate-50">
                          Incentive Value (USD)
                        </td>
                        {availableTiers.map(tierId => (
                          <td key={tierId} className="p-3 border border-slate-200">
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                placeholder="0"
                                className="pl-8 w-full"
                                value={(tempIncentive.tierValues && tempIncentive.tierValues[tierId]) || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  const newTierValues = { ...(tempIncentive.tierValues || {}) };
                                  newTierValues[tierId] = value;
                                  
                                  // Include this tier in the tierIds array if it's not already there
                                  const currentTierIds = tempIncentive.tierIds || [];
                                  const newTierIds = currentTierIds.includes(tierId) 
                                    ? currentTierIds 
                                    : [...currentTierIds, tierId];
                                    
                                  setTempIncentive({
                                    ...tempIncentive,
                                    tierValues: newTierValues,
                                    tierIds: newTierIds // Auto-select this tier when entering a value
                                  });
                                }}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
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
              
              {/* Apply to Tiers section - automatically adds all tiers */}
              <div className="hidden">
                {/* Hidden but still functional - auto-selection happens in useEffect above */}
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
    </div>
  );
}