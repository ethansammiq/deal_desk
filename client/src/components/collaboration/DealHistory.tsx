import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueryStateHandler } from "@/components/ui/loading-states";
import { CheckCircle2, Clock, AlertTriangle, FileText, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface DealHistoryEvent {
  id: string;
  type: 'status_change' | 'approval_action' | 'department_approval';
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  status?: 'completed' | 'pending' | 'attention' | 'revision';
  department?: string;
}

interface DealHistoryProps {
  dealId: number;
}

export function DealHistory({ dealId }: DealHistoryProps) {
  // Fetch deal history data from multiple sources
  const { data: historyEvents, isLoading, error } = useQuery({
    queryKey: [`/api/deals/${dealId}/history`],
    queryFn: async (): Promise<DealHistoryEvent[]> => {
      const response = await fetch(`/api/deals/${dealId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal history');
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const getEventIcon = (event: DealHistoryEvent) => {
    switch (event.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'attention':
      case 'revision':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const getEventBadgeVariant = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'attention':
      case 'revision':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#3e0075]" />
          Deal History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <QueryStateHandler
          query={{ data: historyEvents, isLoading, error }}
          loadingComponent={<div className="text-sm text-slate-500">Loading deal history...</div>}
          errorComponent={<div className="text-sm text-red-600">Failed to load deal history</div>}
        >
          {(historyEvents) => historyEvents && historyEvents.length > 0 ? (
            <div className="space-y-4">
              {historyEvents.map((event, index) => (
                <div key={event.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200">
                      {getEventIcon(event)}
                    </div>
                    {index < historyEvents.length - 1 && (
                      <div className="w-px h-6 bg-slate-200 mt-2" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 text-sm">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.status && (
                          <Badge 
                            variant={getEventBadgeVariant(event.status)}
                            className="text-xs"
                          >
                            {event.status === 'attention' ? 'Needs Attention' : 
                             event.status === 'revision' ? 'Revision Requested' :
                             event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        )}
                        {event.department && (
                          <Badge variant="outline" className="text-xs">
                            {event.department}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-slate-600 mb-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        {format(new Date(event.timestamp), 'MMM dd, yyyy • h:mm a')}
                      </span>
                      {event.actor && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.actor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No history available for this deal</p>
            </div>
          )
          }
        </QueryStateHandler>
      </CardContent>
    </Card>
  );
}