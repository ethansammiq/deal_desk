import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { incentiveCategories } from "@/lib/incentive-data";
import { DealTier } from "@/hooks/useDealTiers";
import { incentiveSelectionToDealTier } from "@/lib/incentive-mapping";

interface IncentiveSelectorProps {
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  onClose: () => void;
}

export function IncentiveSelector({
  dealTiers,
  setDealTiers,
  onClose,
}: IncentiveSelectorProps) {
  // Local state for incentive selection
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [tierValues, setTierValues] = useState<{ [tierNumber: number]: number }>({});

  // Get available subcategories based on selected category
  const getSubCategories = () => {
    const category = incentiveCategories.find(c => c.id === selectedCategory);
    return category?.subCategories || [];
  };

  // Get available options based on selected subcategory
  const getOptions = () => {
    const category = incentiveCategories.find(c => c.id === selectedCategory);
    const subCategory = category?.subCategories.find(s => s.id === selectedSubCategory);
    return subCategory?.options || [];
  };

  // Handle tier value changes
  const handleTierValueChange = (tierNumber: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTierValues(prev => ({
      ...prev,
      [tierNumber]: numValue
    }));
  };

  // Handle incentive save
  const handleSave = () => {
    if (!selectedCategory || !selectedSubCategory || !selectedOption) {
      return; // Basic validation
    }

    // Convert selection to DealTier field updates
    const incentiveFields = incentiveSelectionToDealTier(selectedCategory, selectedSubCategory, selectedOption);
    
    // Update all selected tiers with the incentive and their respective values
    const updatedTiers = dealTiers.map(tier => {
      const tierValue = tierValues[tier.tierNumber] || 0;
      if (tierValue > 0) {
        return {
          ...tier,
          ...incentiveFields,
          incentiveValue: tierValue
        };
      }
      return tier;
    });

    setDealTiers(updatedTiers);
    onClose();
  };

  // Reset form
  const handleReset = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedOption("");
    setTierValues({});
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Incentive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Category Selection */}
        <div>
          <Label className="text-sm font-medium">1. Select Category</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {incentiveCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubCategory("");
                  setSelectedOption("");
                }}
                className="justify-start"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Step 2: Sub-Category Selection */}
        {selectedCategory && (
          <div>
            <Label className="text-sm font-medium">2. Select Sub-Category</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {getSubCategories().map((subCategory) => (
                <Button
                  key={subCategory.id}
                  type="button"
                  variant={selectedSubCategory === subCategory.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSubCategory(subCategory.id);
                    setSelectedOption("");
                  }}
                  className="justify-start"
                >
                  {subCategory.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Option Selection */}
        {selectedSubCategory && (
          <div>
            <Label className="text-sm font-medium">3. Select Specific Incentive</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {getOptions().map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={selectedOption === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedOption(option)}
                  className="justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Tier Value Assignment */}
        {selectedOption && (
          <div>
            <Label className="text-sm font-medium">4. Set Values for Each Tier</Label>
            <div className="space-y-3 mt-2">
              {dealTiers.map((tier) => (
                <div key={tier.tierNumber} className="flex items-center gap-3">
                  <Label className="min-w-[80px]">Tier {tier.tierNumber}:</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={tierValues[tier.tierNumber] || ""}
                      onChange={(e) => handleTierValueChange(tier.tierNumber, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={!selectedOption || Object.keys(tierValues).length === 0}
            >
              Apply Incentive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}