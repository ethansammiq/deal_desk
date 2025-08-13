// Phase 7B: Role-based deal status actions component
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAllowedTransitions } from "@/hooks/useAllowedTransitions";
import { useDealStatus } from "@/hooks/useDealStatus";
import { useUserPermissions } from "@/hooks/useAuth";
import { ChevronRight, AlertCircle } from "lucide-react";
import { DEAL_STATUS_LABELS, type DealStatus } from "@shared/schema";

interface RoleBasedStatusActionsProps {
  dealId: number;
  currentStatus: DealStatus;
  className?: string;
}

export function RoleBasedStatusActions({
  dealId,
  currentStatus,
  className,
}: RoleBasedStatusActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<DealStatus | null>(null);
  const [comments, setComments] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: allowedTransitions = [] } = useAllowedTransitions(dealId, currentStatus);
  const updateStatus = useDealStatus().updateDealStatus;
  const { currentUser } = useUserPermissions();

  const handleStatusChange = () => {
    if (!selectedStatus) return;
    
    updateStatus.mutate(
      {
        dealId,
        status: selectedStatus,
        comments: comments.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedStatus(null);
          setComments("");
        },
      }
    );
  };

  const getStatusVariant = (status: DealStatus) => {
    switch (status) {
      case "approved":
        return "default";
      case "lost":
        return "destructive";
      case "signed":
        return "default";
      default:
        return "secondary";
    }
  };

  if (!currentUser || allowedTransitions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4 mr-1" />
            Change Status
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Deal Status</DialogTitle>
            <DialogDescription>
              Select a new status for this deal. Only transitions allowed by your role are shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-status">Current Status</Label>
              <Badge variant="outline" className="w-fit">
                {DEAL_STATUS_LABELS[currentStatus]}
              </Badge>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value as DealStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusVariant(status)} className="text-xs">
                          {DEAL_STATUS_LABELS[status]}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments about this status change..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            {selectedStatus && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Role Permission</p>
                  <p className="text-blue-700">
                    Your role ({currentUser.role}) allows this status transition.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedStatus(null);
                setComments("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || updateStatus?.isPending}
            >
              {updateStatus?.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}