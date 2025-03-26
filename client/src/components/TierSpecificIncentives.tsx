import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";

export interface TierIncentive {
  tierId: number;
  type: string; // 'volume_discount', 'rebate', etc.
  percentage: number;
  value?: number;
  notes?: string;
}

interface TierSpecificIncentivesProps {
  dealTiers: Array<{tierNumber: number, annualRevenue: number, [key: string]: any}>;
  incentives: TierIncentive[];
  onChange: (incentives: TierIncentive[]) => void;
}

export default function TierSpecificIncentives({
  dealTiers,
  incentives,
  onChange
}: TierSpecificIncentivesProps) {
  const [tempIncentive, setTempIncentive] = useState<Partial<TierIncentive>>({});
  
  const handleAddIncentive = () => {
    if (tempIncentive.tierId && tempIncentive.type && tempIncentive.percentage) {
      const newIncentive: TierIncentive = {
        tierId: tempIncentive.tierId,
        type: tempIncentive.type,
        percentage: tempIncentive.percentage,
        value: tempIncentive.value,
        notes: tempIncentive.notes
      };
      
      // Check if we already have an incentive for this tier and type
      const existingIndex = incentives.findIndex(
        i => i.tierId === newIncentive.tierId && i.type === newIncentive.type
      );
      
      const updatedIncentives = [...incentives];
      
      if (existingIndex >= 0) {
        // Replace existing incentive
        updatedIncentives[existingIndex] = newIncentive;
      } else {
        // Add new incentive
        updatedIncentives.push(newIncentive);
      }
      
      onChange(updatedIncentives);
      setTempIncentive({});
    }
  };
  
  const handleRemoveIncentive = (index: number) => {
    const newIncentives = [...incentives];
    newIncentives.splice(index, 1);
    onChange(newIncentives);
  };
  
  const calculateValue = (tier: {tierNumber: number, annualRevenue: number}, percentage: number) => {
    return tier.annualRevenue * (percentage / 100);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tier-Specific Incentives</h3>
      
      {/* Display incentives in table format */}
      {incentives.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incentives.map((incentive, index) => {
                const tier = dealTiers.find(t => t.tierNumber === incentive.tierId);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        Tier {incentive.tierId}
                      </Badge>
                    </TableCell>
                    <TableCell>{incentive.type.replace('_', ' ')}</TableCell>
                    <TableCell>{incentive.percentage}%</TableCell>
                    <TableCell>
                      {tier ? `$${calculateValue(tier, incentive.percentage).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">{incentive.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIncentive(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add new tier-specific incentive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Tier Incentive</CardTitle>
          <CardDescription>Set specific incentive percentages for each tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tier selection */}
          <div className="space-y-2">
            <Label>Select Tier</Label>
            <div className="flex flex-wrap gap-2">
              {dealTiers.map(tier => (
                <Button
                  key={tier.tierNumber}
                  type="button"
                  variant={tempIncentive.tierId === tier.tierNumber ? "default" : "outline"}
                  onClick={() => setTempIncentive({
                    ...tempIncentive,
                    tierId: tier.tierNumber
                  })}
                >
                  Tier {tier.tierNumber}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Incentive type */}
          <div className="space-y-2">
            <Label>Incentive Type</Label>
            <div className="flex flex-wrap gap-2">
              {['volume_discount', 'rebate', 'bonus'].map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={tempIncentive.type === type ? "default" : "outline"}
                  onClick={() => setTempIncentive({
                    ...tempIncentive,
                    type
                  })}
                >
                  {type.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Percentage */}
          {tempIncentive.tierId && tempIncentive.type && (
            <div className="space-y-2">
              <Label>Percentage</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className="pr-8"
                  value={tempIncentive.percentage || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setTempIncentive({
                      ...tempIncentive,
                      percentage: isNaN(value) ? 0 : value
                    });
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</div>
              </div>
              
              {/* Preview calculated value */}
              {tempIncentive.percentage && tempIncentive.tierId && (
                <div className="text-sm text-gray-500 mt-1">
                  {(() => {
                    const tier = dealTiers.find(t => t.tierNumber === tempIncentive.tierId);
                    if (tier && tempIncentive.percentage) {
                      const value = calculateValue(tier, tempIncentive.percentage);
                      return `Value: $${value.toLocaleString()}`;
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}
          
          {/* Notes */}
          {tempIncentive.tierId && tempIncentive.type && (
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any details about this incentive..."
                value={tempIncentive.notes || ''}
                onChange={(e) => setTempIncentive({
                  ...tempIncentive,
                  notes: e.target.value
                })}
              />
            </div>
          )}
          
          {/* Add button */}
          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={handleAddIncentive}
              disabled={!tempIncentive.tierId || !tempIncentive.type || !tempIncentive.percentage}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tier Incentive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}