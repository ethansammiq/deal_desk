import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealComments } from "@/components/collaboration/DealComments";
import { StatusHistory } from "@/components/collaboration/StatusHistory";
import { DealHistory } from "@/components/collaboration/DealHistory";

import { Clock, MessageSquare, FileText, Activity } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";

interface ActivityFeedProps {
  deal: Deal;
  dealId: number;
}

export function ActivityFeed({ deal, dealId }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'status' | 'comments' | 'history'>('all');

  // Simple timeline data from deal properties
  const timelineEvents = [
    {
      type: 'created' as const,
      title: 'Deal Created',
      date: deal.createdAt,
      icon: FileText,
      description: `Deal ${deal.dealName} was created`
    },
    ...(deal.lastRevisedAt ? [{
      type: 'revised' as const,
      title: 'Revision Requested',
      date: deal.lastRevisedAt,
      icon: MessageSquare,
      description: deal.revisionReason || 'Revision requested'
    }] : [])
  ].filter(event => event.date).sort((a, b) => 
    new Date(b.date!).getTime() - new Date(a.date!).getTime()
  );

  const getFilteredContent = () => {
    switch (activeFilter) {
      case 'status':
        return <StatusHistory deal={deal} />;
      case 'comments':
        return <DealComments deal={deal} />;
      case 'history':
        return <DealHistory deal={deal} />;
      default:
        return (
          <div className="space-y-4">
            {/* Key Timeline Events */}
            <div className="space-y-3">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-full border">
                      <Icon className="h-3 w-3 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <time className="text-xs text-gray-500">
                          {event.date && format(new Date(event.date), 'MMM dd, yyyy')}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Embedded Comments Preview */}
            <div className="border-t pt-4">
              <DealComments deal={deal} />
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity & Discussion
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'status' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('status')}
            >
              Status
            </Button>
            <Button
              variant={activeFilter === 'comments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('comments')}
            >
              Comments
            </Button>
            <Button
              variant={activeFilter === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('history')}
            >
              History
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {getFilteredContent()}
      </CardContent>
    </Card>
  );
}