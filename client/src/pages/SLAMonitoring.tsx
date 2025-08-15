import React from 'react';
import { SLAMonitoringDashboard } from '@/components/sla/SLAMonitoringDashboard';

export default function SLAMonitoring() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SLAMonitoringDashboard />
      </div>
    </div>
  );
}