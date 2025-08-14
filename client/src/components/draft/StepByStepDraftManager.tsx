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
  onSave 
}: StepByStepDraftManagerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save after 3 seconds of inactivity
  const debouncedSave = useCallback(async (data: any, step: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveDraft(data, step, true); // Auto-save flag
    }, 3000);
  }, []);

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
      const clientName = data.advertiserName || data.agencyName || "New Client";
      const autoName = `${clientName} - ${data.dealType || 'Deal'} Draft`;
      
      // Clean up form data for draft submission
      const cleanFormData = { ...data };
      
      // Remove or fix validation-problematic fields for drafts
      if (cleanFormData.growthAmbition === 0 || cleanFormData.growthAmbition < 1000000) {
        delete cleanFormData.growthAmbition; // Remove field if it doesn't meet validation
      }
      
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
        }
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

  // Auto-save trigger on form data changes
  React.useEffect(() => {
    if (formData && (formData.dealName || formData.advertiserName || formData.agencyName)) {
      debouncedSave(formData, currentStep);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, currentStep, debouncedSave]);

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
          disabled={isSaving || !isValid}
        >
          <Save className="h-3 w-3 mr-1" />
          Save Draft
        </Button>
      </div>
    </div>
  );
}