import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DealSummaryCardProps {
  formValues: any;
  dealStructureType: "tiered" | "flat_commit" | "";
  contractTerm: number;
}

export function DealSummaryCard({ formValues, dealStructureType, contractTerm }: DealSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deal Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Information Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Client Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formValues.advertiserName && (
              <div>
                <label className="text-sm font-medium text-gray-700">Advertiser</label>
                <p className="text-base">{formValues.advertiserName}</p>
              </div>
            )}
            {formValues.agencyName && (
              <div>
                <label className="text-sm font-medium text-gray-700">Agency</label>
                <p className="text-base">{formValues.agencyName}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Sales Channel</label>
              <p className="text-base">
                {formValues.salesChannel === "client_direct" ? "Client Direct" :
                 formValues.salesChannel === "holding_company" ? "Holding Company" :
                 "Independent Agency"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Region</label>
              <p className="text-base capitalize">{formValues.region}</p>
            </div>
          </div>
        </div>

        {/* Deal Timeline Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Deal Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Deal Type</label>
              <p className="text-base capitalize">{formValues.dealType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Structure</label>
              <p className="text-base">
                {dealStructureType === "tiered" ? "Tiered Revenue" : "Flat Commit"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contract Term</label>
              <p className="text-base">{contractTerm} months</p>
            </div>
            {formValues.termStartDate && (
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <p className="text-base">{new Date(formValues.termStartDate).toLocaleDateString()}</p>
              </div>
            )}
            {formValues.termEndDate && (
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <p className="text-base">{new Date(formValues.termEndDate).toLocaleDateString()}</p>
              </div>
            )}
            {formValues.contractTermMonths && (
              <div>
                <label className="text-sm font-medium text-gray-700">Contract Term (Months)</label>
                <p className="text-base">{formValues.contractTermMonths}</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Context Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Business Context</h4>
          <div className="space-y-3">
            {formValues.growthOpportunityMIQ && (
              <div>
                <label className="text-sm font-medium text-gray-700">Growth Opportunity (MIQ)</label>
                <p className="text-base">{formValues.growthOpportunityMIQ}</p>
              </div>
            )}
            {formValues.growthOpportunityClient && (
              <div>
                <label className="text-sm font-medium text-gray-700">Growth Opportunity (Client)</label>
                <p className="text-base">{formValues.growthOpportunityClient}</p>
              </div>
            )}
            {formValues.clientAsks && (
              <div>
                <label className="text-sm font-medium text-gray-700">Client Requirements</label>
                <p className="text-base">{formValues.clientAsks}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}