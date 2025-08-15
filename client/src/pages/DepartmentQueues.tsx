import React from 'react';
import { DepartmentQueueDashboard } from '@/components/approval/DepartmentQueueDashboard';

export default function DepartmentQueues() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <DepartmentQueueDashboard />
      </div>
    </div>
  );
}