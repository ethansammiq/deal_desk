import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const [notes, setNotes] = useState("");

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
          incentiveValue: tierValue,
          incentiveNotes: notes
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
    setNotes("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Incentive</CardTitle>
        <p className="text-sm text-gray-600">Select a category, sub-category, and specific incentive option</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Category Selection with Icons */}
        <div>
          <Label className="text-sm font-medium">1. Select Incentive Category</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {incentiveCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubCategory("");
                  setSelectedOption("");
                }}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span>{category.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Step 2: Sub-Category Selection */}
        {selectedCategory && (
          <div>
            <Label className="text-sm font-medium">2. Select Sub-Category</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {getSubCategories().map((subCategory) => (
                <Button
                  key={subCategory.id}
                  type="button"
                  variant={selectedSubCategory === subCategory.id ? "default" : "outline"}
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
            <Select value={selectedOption} onValueChange={setSelectedOption}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an incentive option" />
              </SelectTrigger>
              <SelectContent>
                {getOptions().map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 4: Configure Incentive by Tier - Table Format */}
        {selectedOption && (
          <div>
            <Label className="text-sm font-medium">4. Configure Incentive by Tier</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700 border-b border-gray-200 border-r border-gray-200">
                      Value Details
                    </th>
                    {dealTiers.map((tier) => (
                      <th key={tier.tierNumber} className="text-center p-4 font-medium text-gray-700 border-b border-gray-200 border-r border-gray-200 last:border-r-0">
                        Tier {tier.tierNumber}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 font-medium text-gray-900 bg-gray-50 border-r border-gray-200">
                      Incentive Value (USD)
                    </td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                        <div className="flex items-center justify-center">
                          <span className="text-gray-500 mr-1">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={tierValues[tier.tierNumber] || ""}
                            onChange={(e) => handleTierValueChange(tier.tierNumber, e.target.value)}
                            className="w-24 text-center border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {selectedOption && (
          <div>
            <Label className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional details about this incentive..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
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
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Incentive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}