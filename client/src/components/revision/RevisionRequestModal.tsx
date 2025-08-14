import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Send } from "lucide-react";
import { Deal } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export function RevisionRequestModal({ isOpen, onClose, deal }: RevisionRequestModalProps) {
  const [revisionReason, setRevisionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const revisionMutation = useMutation({
    mutationFn: async (data: { dealId: number; revisionReason: string }) => {
      return apiRequest(`/api/deals/${data.dealId}/request-revision`, {
        method: "POST",
        body: JSON.stringify({ revisionReason: data.revisionReason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Revision Requested",
        description: "The seller has been notified and can now make revisions to the deal.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to Request Revision",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
      console.error("Revision request failed:", error);
    }
  });

  const handleSubmit = async () => {
    if (!revisionReason.trim()) {
      toast({
        title: "Revision Reason Required",
        description: "Please provide a reason for requesting revisions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await revisionMutation.mutateAsync({
        dealId: deal.id,
        revisionReason: revisionReason.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRevisionReason("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Request Revision
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Deal Info */}
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Deal: {deal.dealName}</span>
              <Badge variant="outline" className="text-xs">
                Rev {deal.revisionCount || 0}
              </Badge>
            </div>
            <div className="text-xs text-slate-600">
              Client: {deal.advertiserName || deal.agencyName || 'N/A'} • Region: {deal.region}
            </div>
          </div>

          {/* Revision Reason */}
          <div className="space-y-2">
            <Label htmlFor="revisionReason" className="text-sm font-medium">
              Revision Reason *
            </Label>
            <Textarea
              id="revisionReason"
              placeholder="Please explain what needs to be revised and provide specific guidance for the seller..."
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="text-xs text-slate-500">
              Be specific about what changes are needed to help the seller address your concerns effectively.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !revisionReason.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Request Revision
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}