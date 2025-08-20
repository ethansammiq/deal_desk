import React, { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Deal } from "@shared/schema";

interface StepByStepDraftManagerProps {
  formData: any;
  currentStep: number;
  totalSteps: number;
  isValid?: boolean;
  onSave?: () => void;
  draftId?: number; // Added to support updating existing drafts
}

// Business rule: One draft per advertiser/agency combination per seller
const generateDraftKey = (formData: any): string => {
  if (formData.advertiserName) {
    return `draft_${formData.advertiserName}`;
  }
  if (formData.agencyName) {
    return `draft_${formData.agencyName}`;
  }
  return `draft_temp_${Date.now()}`;
};

export function StepByStepDraftManager({ 
  formData, 
  currentStep, 
  totalSteps,
  isValid = true,
  onSave,
  draftId
}: StepByStepDraftManagerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality removed as requested

  const saveDraft = async (data: any, step: number, isAutoSave = false) => {
    if (!data.dealName && !data.advertiserName && !data.agencyName) {
      if (!isAutoSave) {
        toast({
          title: "Cannot Save Draft",
          description: "Please provide a deal name or client information before saving.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate auto-name for draft if not provided
      const clientName = data.advertiserName || data.agencyName || "Draft";
      const autoName = `${clientName} - ${data.dealType || 'Deal'} Draft`;
      
      // Clean up form data for draft submission
      const cleanFormData = { ...data };
      
      // Remove fields that don't belong to SubmitDeal form
      delete cleanFormData.growthAmbition; // This field only exists in scoping form, not submit form
      
      // Remove deprecated financial fields - now managed through tier data
      delete cleanFormData.annualRevenue;
      delete cleanFormData.annualGrossMargin;
      delete cleanFormData.yearlyRevenueGrowthRate;
      delete cleanFormData.forecastedMargin;
      delete cleanFormData.yearlyMarginGrowthRate;
      delete cleanFormData.addedValueBenefitsCost;
      
      const requestPayload = {
        name: autoName,
        description: `Auto-saved draft at step ${step}`,
        formData: {
          ...cleanFormData,
          status: "draft",
          isDraft: true,
          draftType: "submission_draft",
          currentStep: step,
          lastSavedAt: new Date().toISOString(),
          formProgress: {
            completedSteps: Array.from({ length: step - 1 }, (_, i) => i + 1),
            currentStep: step,
            totalSteps: totalSteps
          }
        },
        draftId: draftId // Include draft ID for updates
      };

      const response = await apiRequest('/api/deals/drafts', {
        method: 'POST',
        body: JSON.stringify(requestPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setLastSaved(new Date());
      onSave?.();
      
      if (!isAutoSave) {
        toast({
          title: "Draft Saved",
          description: `Your progress has been saved at step ${step} of ${totalSteps}.`,
        });
      }
      
    } catch (error) {
      console.error('Draft save error:', error);
      if (error && typeof error === 'object' && 'details' in error) {
        console.error('Validation details:', error.details);
      }
      console.error('Form data being sent:', JSON.stringify(data, null, 2));
      if (!isAutoSave) {
        toast({
          title: "Save Failed",
          description: "Could not save draft. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save handler
  const handleSave = () => {
    saveDraft(formData, currentStep);
  };

  // Auto-save removed as requested by user - only manual save now

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-slate-500" />
        <div className="text-sm">
          <div className="font-medium text-slate-700">
            Step {currentStep} of {totalSteps}
          </div>
          {lastSaved && (
            <div className="text-xs text-slate-500">
              Last saved {formatLastSaved(lastSaved)}
            </div>
          )}
        </div>
        
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        {isSaving && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            Saving...
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-3 w-3 mr-1" />
          Save Draft
        </Button>
      </div>
    </div>
  );
}