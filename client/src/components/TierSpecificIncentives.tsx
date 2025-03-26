import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

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
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tempIncentive, setTempIncentive] = useState<Partial<TierIncentive>>({
    type: 'volume_discount',
    percentage: 0,
    notes: ''
  });

  // Find existing incentive for a tier or return null
  const getIncentiveForTier = (tierId: number) => {
    return incentives.find(i => i.tierId === tierId) || null;
  };

  // Start editing an incentive for a tier
  const startEdit = (tierId: number) => {
    const existing = getIncentiveForTier(tierId);
    setEditingTierId(tierId);
    setTempIncentive(existing || {
      tierId,
      type: 'volume_discount',
      percentage: 0,
      notes: ''
    });
  };

  // Save the current edit
  const saveEdit = () => {
    if (!editingTierId || !tempIncentive.percentage) return;
    
    const tier = dealTiers.find(t => t.tierNumber === editingTierId);
    if (!tier) return;
    
    // Calculate the value based on the percentage
    const value = tier.annualRevenue * (tempIncentive.percentage! / 100);
    
    const newIncentive: TierIncentive = {
      tierId: editingTierId,
      type: tempIncentive.type || 'volume_discount',
      percentage: tempIncentive.percentage!,
      value,
      notes: tempIncentive.notes
    };
    
    // Remove any existing incentive for this tier and add the new one
    const updatedIncentives = [
      ...incentives.filter(i => i.tierId !== editingTierId),
      newIncentive
    ];
    
    onChange(updatedIncentives);
    setEditingTierId(null);
    setTempIncentive({ type: 'volume_discount', percentage: 0, notes: '' });
  };

  // Cancel the current edit
  const cancelEdit = () => {
    setEditingTierId(null);
    setTempIncentive({ type: 'volume_discount', percentage: 0, notes: '' });
  };

  // Remove an incentive
  const removeIncentive = (tierId: number) => {
    onChange(incentives.filter(i => i.tierId !== tierId));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Tier</th>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Revenue Threshold</th>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Discount Type</th>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Percentage</th>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Value</th>
              <th className="text-left p-3 bg-slate-100 border border-slate-200">Notes</th>
              <th className="text-center p-3 bg-slate-100 border border-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dealTiers
              .sort((a, b) => a.tierNumber - b.tierNumber)
              .map((tier) => {
                const incentive = getIncentiveForTier(tier.tierNumber);
                const isEditing = editingTierId === tier.tierNumber;
                
                return (
                  <tr key={tier.tierNumber} className="hover:bg-slate-50">
                    <td className="p-3 border border-slate-200">
                      <Badge variant="outline" className="font-medium">
                        Tier {tier.tierNumber}
                      </Badge>
                    </td>
                    <td className="p-3 border border-slate-200">
                      {formatCurrency(tier.annualRevenue)}
                    </td>
                    <td className="p-3 border border-slate-200">
                      {isEditing ? (
                        <Select 
                          value={tempIncentive.type}
                          onValueChange={(value) => setTempIncentive({...tempIncentive, type: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="volume_discount">Volume Discount</SelectItem>
                            <SelectItem value="rebate">Rebate</SelectItem>
                            <SelectItem value="bonus">Bonus</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        incentive ? 
                          incentive.type.replace('_', ' ') : 
                          <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 border border-slate-200">
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            type="number"
                            className="pr-8"
                            placeholder="0.00"
                            min="0"
                            max="100"
                            value={tempIncentive.percentage || ''}
                            onChange={(e) => setTempIncentive({
                              ...tempIncentive, 
                              percentage: parseFloat(e.target.value)
                            })}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-slate-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      ) : (
                        incentive ? 
                          `${incentive.percentage}%` : 
                          <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 border border-slate-200">
                      {incentive ? 
                        formatCurrency(incentive.value || 0) : 
                        <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="p-3 border border-slate-200">
                      {isEditing ? (
                        <Textarea
                          placeholder="Enter notes..."
                          value={tempIncentive.notes || ''}
                          onChange={(e) => setTempIncentive({...tempIncentive, notes: e.target.value})}
                          className="min-h-[80px]"
                        />
                      ) : (
                        incentive?.notes ? 
                          incentive.notes : 
                          <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 border border-slate-200 text-center">
                      {isEditing ? (
                        <div className="flex space-x-2 justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={saveEdit}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2 justify-center">
                          {incentive ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(tier.tierNumber)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeIncentive(tier.tierNumber)}
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(tier.tierNumber)}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}