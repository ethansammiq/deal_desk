import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Deal } from "@shared/schema";
import { ArrowRight, AlertCircle } from "lucide-react";

interface StatusTransitionModalProps {
  deal: Deal;
  allowedTransitions: string[];
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StatusTransitionModal({
  deal,
  allowedTransitions,
  userRole,
  isOpen,
  onClose
}: StatusTransitionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusMutation = useMutation({
    mutationFn: async (data: { dealId: number; status: string; comments: string; userRole: string }) => {
      const response = await fetch(`/api/deals/${data.dealId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: data.status,
          comments: data.comments,
          userRole: data.userRole
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', deal.id] });
      toast({
        title: "Status Updated",
        description: `Deal status changed to ${selectedStatus}`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast({
        title: "Status Required",
        description: "Please select a status to transition to.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await statusMutation.mutateAsync({
        dealId: deal.id,
        status: selectedStatus,
        comments: comments.trim(),
        userRole
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus("");
    setComments("");
    setIsSubmitting(false);
    onClose();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      scoping: 'Scoping',
      submitted: 'Submitted',
      under_review: 'Under Review',
      revision_requested: 'Revision Requested',
      negotiating: 'Negotiating',
      approved: 'Approved',
      contract_drafting: 'Contract Drafting',
      client_review: 'Client Review',
      signed: 'Signed',
      lost: 'Lost'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            Update Deal Status
          </DialogTitle>
          <DialogDescription>
            Change the status of this deal and add comments about the transition.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Deal Info */}
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{deal.dealName}</span>
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(deal.status)}
              </Badge>
            </div>
            <div className="text-xs text-slate-600">
              #{deal.referenceNumber} • {deal.advertiserName || deal.agencyName || 'N/A'}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              New Status *
            </Label>
            {allowedTransitions.length > 0 ? (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        {getStatusLabel(status)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  No status transitions available for your role.
                </span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about this status change..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStatus || isSubmitting || statusMutation.isPending}
              className="flex-1"
            >
              {isSubmitting || statusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}