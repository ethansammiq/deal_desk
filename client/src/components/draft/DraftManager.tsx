import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText, Trash2, Clock, Edit3 } from "lucide-react";
import { format } from "date-fns";

interface DraftData {
  id: string;
  name: string;
  formData: any;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

interface DraftManagerProps {
  currentFormData: any;
  onLoadDraft: (draftData: any) => void;
  onSaveDraft: (draftName: string, description?: string) => void;
}

export function DraftManager({ currentFormData, onLoadDraft, onSaveDraft }: DraftManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [savedDrafts, setSavedDrafts] = useState<DraftData[]>(() => {
    // Load drafts from localStorage
    try {
      const stored = localStorage.getItem('deal-submission-drafts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const { toast } = useToast();

  const saveDraftsToStorage = (drafts: DraftData[]) => {
    try {
      localStorage.setItem('deal-submission-drafts', JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save drafts:', error);
    }
  };

  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      toast({
        title: "Draft Name Required",
        description: "Please enter a name for your draft.",
        variant: "destructive",
      });
      return;
    }

    const newDraft: DraftData = {
      id: `draft-${Date.now()}`,
      name: draftName.trim(),
      formData: currentFormData,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: draftDescription.trim() || undefined,
    };

    const updatedDrafts = [...savedDrafts, newDraft];
    setSavedDrafts(updatedDrafts);
    saveDraftsToStorage(updatedDrafts);

    // Call the parent's save handler to create server-side draft
    onSaveDraft(draftName.trim(), draftDescription.trim());

    setDraftName("");
    setDraftDescription("");
    setIsCreating(false);

    toast({
      title: "Draft Saved",
      description: `Your draft "${newDraft.name}" has been saved successfully.`,
    });
  };

  const handleLoadDraft = (draft: DraftData) => {
    onLoadDraft(draft.formData);
    setIsOpen(false);
    
    toast({
      title: "Draft Loaded",
      description: `Loaded draft "${draft.name}" from ${format(new Date(draft.createdAt), 'MMM d, yyyy')}.`,
    });
  };

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
    setSavedDrafts(updatedDrafts);
    saveDraftsToStorage(updatedDrafts);

    toast({
      title: "Draft Deleted",
      description: "The draft has been removed.",
    });
  };

  return (
    <div className="flex gap-2">
      {/* Save as Draft Button */}
      <Button 
        variant="outline" 
        onClick={() => setIsCreating(true)}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        Save as Draft
      </Button>

      {/* Manage Drafts Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Drafts
            {savedDrafts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {savedDrafts.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Saved Drafts</DialogTitle>
            <DialogDescription>
              Load or manage your saved deal drafts. These drafts are stored locally and can be loaded at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {savedDrafts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No saved drafts found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use "Save as Draft" to create your first draft
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {savedDrafts.map((draft) => (
                  <Card key={draft.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{draft.name}</CardTitle>
                          {draft.description && (
                            <CardDescription className="mt-1">
                              {draft.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLoadDraft(draft)}
                            className="flex items-center gap-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            Load Draft
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Created: {format(new Date(draft.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {draft.updatedAt && new Date(draft.updatedAt) > new Date(draft.createdAt) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Updated: {format(new Date(draft.updatedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Draft Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Progress as Draft</DialogTitle>
            <DialogDescription>
              Give your draft a meaningful name so you can easily find it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="draftName">Draft Name</Label>
              <Input
                id="draftName"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g., Microsoft Q4 Deal - Initial Draft"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="draftDescription">Description (Optional)</Label>
              <Input
                id="draftDescription"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Brief description of this draft's status"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreating(false);
              setDraftName("");
              setDraftDescription("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}