import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LostReason, lostReasons } from '@shared/schema';

interface MarkLostModalProps {
  dealId: number;
  dealName: string;
  isOpen: boolean;
  onClose: () => void;
}

const lostReasonLabels: Record<LostReason, string> = {
  client_budget_cut: 'Client Budget Cut',
  client_timeline_change: 'Client Timeline Change',
  competitive_loss: 'Competitive Loss', 
  technical_unfeasibility: 'Technical Unfeasibility',
  internal_resource_constraint: 'Internal Resource Constraint',
  pricing_mismatch: 'Pricing Mismatch',
  compliance_issue: 'Compliance Issue',
  strategic_misalignment: 'Strategic Misalignment',
  client_cancelled_project: 'Client Cancelled Project',
  other: 'Other'
};

export function MarkLostModal({ dealId, dealName, isOpen, onClose }: MarkLostModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    lostReason: '' as LostReason | '',
    lostReasonDetails: '',
    competitorName: '',
    estimatedLostValue: '',
    lessonsLearned: ''
  });

  const markLostMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest(`/api/deals/${dealId}/mark-lost`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
      toast({
        title: "Deal Marked as Lost",
        description: "The deal has been marked as lost and tracking data has been recorded."
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark Deal as Lost",
        description: error.message || "An error occurred while marking the deal as lost.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      lostReason: '',
      lostReasonDetails: '',
      competitorName: '',
      estimatedLostValue: '',
      lessonsLearned: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lostReason) {
      toast({
        title: "Required Field Missing",
        description: "Please select a reason for marking this deal as lost.",
        variant: "destructive"
      });
      return;
    }
    markLostMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!markLostMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Deal as Lost</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Deal</div>
            <div className="font-medium">{dealName}</div>
          </div>

          <div>
            <Label htmlFor="lostReason" className="text-sm font-medium">
              Reason for Loss <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.lostReason} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, lostReason: value as LostReason }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {lostReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {lostReasonLabels[reason]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lostReasonDetails" className="text-sm font-medium">
              Additional Details
            </Label>
            <Textarea
              id="lostReasonDetails"
              placeholder="Provide additional context about why this deal was lost..."
              value={formData.lostReasonDetails}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, lostReasonDetails: e.target.value }))
              }
              rows={3}
            />
          </div>

          {formData.lostReason === 'competitive_loss' && (
            <div>
              <Label htmlFor="competitorName" className="text-sm font-medium">
                Competitor Name
              </Label>
              <Input
                id="competitorName"
                placeholder="Which competitor won this deal?"
                value={formData.competitorName}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, competitorName: e.target.value }))
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="estimatedLostValue" className="text-sm font-medium">
              Estimated Lost Value
            </Label>
            <Input
              id="estimatedLostValue"
              type="number"
              placeholder="0"
              value={formData.estimatedLostValue}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, estimatedLostValue: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="lessonsLearned" className="text-sm font-medium">
              Lessons Learned
            </Label>
            <Textarea
              id="lessonsLearned"
              placeholder="What can we learn from this loss for future deals?"
              value={formData.lessonsLearned}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, lessonsLearned: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={markLostMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {markLostMutation.isPending ? 'Marking as Lost...' : 'Mark as Lost'}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={markLostMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}