import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Clock, MessageSquare, FileText, Activity, History, Send, User, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";

interface UnifiedActivity {
  id: string;
  type: 'status_change' | 'comment' | 'created' | 'revised';
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  actorRole?: string;
  content?: string;
  status?: string;
  previousStatus?: string;
  isSystemComment?: boolean;
}

interface ActivityFeedProps {
  deal: Deal;
  dealId: number;
}

export function ActivityFeed({ deal, dealId }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'status' | 'comments'>('all');
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userRole = user?.role || 'seller';

  // Unified data fetching - consolidates status history and comments
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['/api/deals', dealId, 'unified-activity'],
    queryFn: async (): Promise<UnifiedActivity[]> => {
      const [statusResponse, commentsResponse] = await Promise.all([
        fetch(`/api/deals/${dealId}/history`),
        fetch(`/api/deals/${dealId}/comments`)
      ]);
      
      const statusHistory = statusResponse.ok ? await statusResponse.json() : [];
      const comments = commentsResponse.ok ? await commentsResponse.json() : [];
      
      // Consolidate all activities into unified format
      const unifiedActivities: UnifiedActivity[] = [
        // Deal creation event
        {
          id: `created-${deal.id}`,
          type: 'created',
          title: 'Deal Created',
          description: `Deal ${deal.dealName} was created`,
          timestamp: deal.createdAt || new Date().toISOString(),
          actor: deal.email || 'System'
        },
        // Status changes
        ...statusHistory.map((entry: any) => ({
          id: `status-${entry.id}`,
          type: 'status_change' as const,
          title: `Status changed to ${getStatusLabel(entry.status)}`,
          description: entry.comments,
          timestamp: entry.createdAt,
          actor: entry.changedBy,
          status: entry.status,
          previousStatus: entry.previousStatus
        })),
        // Comments  
        ...comments.map((comment: any) => ({
          id: `comment-${comment.id}`,
          type: 'comment' as const,
          title: comment.isSystemComment ? 'System Update' : 'Comment Added',
          content: comment.content,
          timestamp: comment.createdAt,
          actor: comment.author,
          actorRole: comment.authorRole,
          isSystemComment: comment.isSystemComment
        })),
        // Revision event if exists
        ...(deal.lastRevisedAt ? [{
          id: `revised-${deal.id}`,
          type: 'revised' as const,
          title: 'Revision Requested',
          description: deal.revisionReason || 'Revision requested',
          timestamp: deal.lastRevisedAt,
          actor: 'Approver'
        }] : [])
      ];
      
      return unifiedActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    staleTime: 30000
  });

  // Add comment mutation - consolidated from DealComments
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/deals/${dealId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author: user?.email || 'unknown',
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
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'unified-activity'] });
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
    if (!trimmedComment) return;
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(trimmedComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility functions consolidated from individual components
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft', scoping: 'Scoping', submitted: 'Submitted', under_review: 'Under Review',
      negotiating: 'Negotiating', approved: 'Approved', contract_drafting: 'Contract Drafting',
      client_review: 'Client Review', signed: 'Signed', lost: 'Lost'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-800', scoping: 'bg-blue-100 text-blue-800',
      submitted: 'bg-indigo-100 text-indigo-800', under_review: 'bg-amber-100 text-amber-800',
      negotiating: 'bg-purple-100 text-purple-800', approved: 'bg-emerald-100 text-emerald-800',
      contract_drafting: 'bg-teal-100 text-teal-800', client_review: 'bg-cyan-100 text-cyan-800',
      signed: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      seller: 'bg-blue-100 text-blue-800', approver: 'bg-green-100 text-green-800',
      legal: 'bg-purple-100 text-purple-800', admin: 'bg-red-100 text-red-800',
      department_reviewer: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (activity: UnifiedActivity) => {
    switch (activity.type) {
      case 'status_change':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'comment':
        return activity.isSystemComment ? 
          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
          <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'revised':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredActivities = activities?.filter(activity => {
    switch (activeFilter) {
      case 'status':
        return activity.type === 'status_change' || activity.type === 'created' || activity.type === 'revised';
      case 'comments':
        return activity.type === 'comment';
      default:
        return true;
    }
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
          {activities && (
            <Badge variant="outline" className="ml-auto">
              {filteredActivities.length} activities
            </Badge>
          )}
        </CardTitle>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {(['all', 'status', 'comments'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="capitalize"
            >
              {filter === 'all' ? 'All Activity' : filter}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-sm text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
            Loading activity feed...
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-sm text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            Failed to load activity feed
          </div>
        )}
        
        {/* Empty State */}
        {filteredActivities.length === 0 && !isLoading && !error && (
          <div className="text-center py-8 text-sm text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No activities found
          </div>
        )}
        
        {/* Activity Timeline */}
        {filteredActivities.length > 0 && (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200">
                    {getActivityIcon(activity)}
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="w-px h-6 bg-slate-200 mt-2" />
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {activity.title}
                    </h4>
                    <time className="text-xs text-slate-500 flex-shrink-0">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                    </time>
                  </div>
                  
                  {/* Activity description or content */}
                  {activity.content && (
                    <div className="bg-slate-50 p-3 rounded-lg border mb-2">
                      <p className="text-sm text-slate-700">{activity.content}</p>
                    </div>
                  )}
                  
                  {activity.description && (
                    <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                  )}
                  
                  {/* Actor and status info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.actor && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{activity.actor}</span>
                      </div>
                    )}
                    
                    {activity.actorRole && (
                      <Badge className={`text-xs px-2 py-0.5 ${getRoleColor(activity.actorRole)}`}>
                        {activity.actorRole}
                      </Badge>
                    )}
                    
                    {activity.status && activity.type === 'status_change' && (
                      <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(activity.status)}`}>
                        {getStatusLabel(activity.status)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Comment Section - Only show for comments filter or all */}
        {(activeFilter === 'comments' || activeFilter === 'all') && (
          <div className="border-t pt-4 mt-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Add Comment
              </h4>
              
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment to this deal..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user?.email?.slice(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-500">
                      Commenting as {user?.email}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                    className="gap-1"
                  >
                    {isSubmitting ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    {isSubmitting ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}