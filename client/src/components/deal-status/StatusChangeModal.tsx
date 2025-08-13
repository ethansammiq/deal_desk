import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STATUSES, DEAL_STATUS_LABELS, type DealStatus } from "@shared/schema";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: DealStatus, comments?: string) => void;
  currentStatus: DealStatus;
  dealName: string;
  isLoading?: boolean;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  onStatusChange,
  currentStatus,
  dealName,
  isLoading = false
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<DealStatus | "">("");
  const [comments, setComments] = useState("");

  const handleSubmit = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      onStatusChange(selectedStatus as DealStatus, comments || undefined);
      setComments("");
      setSelectedStatus("");
    }
  };

  const handleClose = () => {
    setComments("");
    setSelectedStatus("");
    onClose();
  };

  // Get available status options (exclude current status)
  const availableStatuses = Object.entries(DEAL_STATUSES)
    .filter(([_, value]) => value !== currentStatus)
    .map(([key, value]) => ({ key, value }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Deal Status</DialogTitle>
          <DialogDescription>
            Update the status for "{dealName}". Current status: {DEAL_STATUS_LABELS[currentStatus]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map(({ key, value }) => (
                  <SelectItem key={value} value={value}>
                    {DEAL_STATUS_LABELS[value as DealStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any notes about this status change..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedStatus || selectedStatus === currentStatus || isLoading}
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}