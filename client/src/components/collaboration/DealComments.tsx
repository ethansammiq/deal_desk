import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Deal } from "@shared/schema";
import { MessageSquare, Send, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: number;
  dealId: number;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
  isSystemComment?: boolean;
}

interface DealCommentsProps {
  deal: Deal;
  userRole: string;
  currentUser: string;
}

export function DealComments({ deal, userRole, currentUser }: DealCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch comments for this deal
  const commentsQuery = useQuery({
    queryKey: ['/api/deals', deal.id, 'comments'],
    queryFn: async (): Promise<Comment[]> => {
      const response = await fetch(`/api/deals/${deal.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/deals/${deal.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author: currentUser,
          authorRole: userRole
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', deal.id, 'comments'] });
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the deal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitComment = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(trimmedComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      seller: 'bg-blue-100 text-blue-800',
      approver: 'bg-purple-100 text-purple-800',
      legal: 'bg-green-100 text-green-800',
      admin: 'bg-slate-100 text-slate-800',
      system: 'bg-amber-100 text-amber-800'
    };
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Discussion
          {commentsQuery.data && (
            <Badge variant="outline" className="ml-auto">
              {commentsQuery.data.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {commentsQuery.isLoading && (
            <div className="text-center py-4 text-sm text-slate-500">
              Loading comments...
            </div>
          )}
          
          {commentsQuery.error && (
            <div className="text-center py-4 text-sm text-red-500">
              Failed to load comments
            </div>
          )}
          
          {commentsQuery.data && commentsQuery.data.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No comments yet. Start the conversation!
            </div>
          )}
          
          {commentsQuery.data?.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-slate-50">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {comment.isSystemComment ? <User className="h-4 w-4" /> : getInitials(comment.author)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.isSystemComment ? 'System' : comment.author}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getRoleColor(comment.authorRole)}`}
                  >
                    {comment.authorRole}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
                    <Clock className="h-3 w-3" />
                    {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment Form */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment or update about this deal..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Comments are visible to all team members working on this deal
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting || addCommentMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting || addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}