import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Deal } from "@shared/schema";
import { History, ArrowRight, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface StatusHistoryEntry {
  id: number;
  dealId: number;
  status: string;
  previousStatus: string;
  changedBy: string;
  comments?: string;
  createdAt: string;
}

interface StatusHistoryProps {
  deal: Deal;
}

export function StatusHistory({ deal }: StatusHistoryProps) {
  const historyQuery = useQuery({
    queryKey: ['/api/deals', deal.id, 'history'],
    queryFn: async (): Promise<StatusHistoryEntry[]> => {
      const response = await fetch(`/api/deals/${deal.id}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      return response.json();
    }
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      scoping: 'Scoping',
      submitted: 'Submitted',
      under_review: 'Under Review',

      negotiating: 'Negotiating',
      approved: 'Approved',
      contract_drafting: 'Contract Drafting',
      client_review: 'Client Review',
      signed: 'Signed',
      lost: 'Lost'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-800',
      scoping: 'bg-blue-100 text-blue-800',
      submitted: 'bg-indigo-100 text-indigo-800',
      under_review: 'bg-amber-100 text-amber-800',

      negotiating: 'bg-purple-100 text-purple-800',
      approved: 'bg-emerald-100 text-emerald-800',
      contract_drafting: 'bg-teal-100 text-teal-800',
      client_review: 'bg-cyan-100 text-cyan-800',
      signed: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const sortedHistory = historyQuery.data?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status History
          {historyQuery.data && (
            <Badge variant="outline" className="ml-auto">
              {historyQuery.data.length} changes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historyQuery.isLoading && (
          <div className="text-center py-4 text-sm text-slate-500">
            Loading status history...
          </div>
        )}
        
        {historyQuery.error && (
          <div className="text-center py-4 text-sm text-red-500">
            Failed to load status history
          </div>
        )}
        
        {sortedHistory && sortedHistory.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No status changes recorded yet
          </div>
        )}
        
        {sortedHistory && sortedHistory.length > 0 && (
          <div className="space-y-4">
            {sortedHistory.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index < sortedHistory.length - 1 && (
                  <div className="absolute left-6 top-8 w-0.5 h-8 bg-slate-200" />
                )}
                
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mt-1">
                    <ArrowRight className="h-5 w-5 text-slate-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {entry.previousStatus && (
                        <>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(entry.previousStatus)}`}
                          >
                            {getStatusLabel(entry.previousStatus)}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(entry.status)}`}
                      >
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm">{entry.changedBy}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                    
                    {entry.comments && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                        {entry.comments}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}