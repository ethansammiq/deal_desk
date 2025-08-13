import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { ClientInfoSection } from "@/components/shared/ClientInfoSection";
import { DealDetailsSection } from "@/components/deal-form/DealDetailsSection";
import { CardContent } from "@/components/ui/card";

interface AgencyData {
  id: string | number;
  name: string;
  type: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface AdvertiserData {
  id: string | number;
  name: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface DealOverviewStepProps {
  form: UseFormReturn<any>;
  agencies: AgencyData[];
  advertisers: AdvertiserData[];
  salesChannel: string;
  dealStructureType: "tiered" | "flat_commit" | "";
  setDealStructure: (value: "tiered" | "flat_commit" | "") => void;
  nextStep?: () => void;
  // Layout configuration
  layout?: "tabs" | "cards"; // tabs for Deal Scoping, cards for Deal Submission
  includeEmail?: boolean;
  showNavigation?: boolean;
}

export function DealOverviewStep({
  form,
  agencies,
  advertisers,
  salesChannel,
  dealStructureType,
  setDealStructure,
  nextStep,
  layout = "cards",
  includeEmail = false,
  showNavigation = true,
}: DealOverviewStepProps) {
  
  if (layout === "tabs") {
    // Deal Scoping layout - using tabs structure
    return (
      <div className="space-y-6 pt-4">
        {/* Client Information Section */}
        <div>
          <FormSectionHeader
            title="Client Information"
            description="Select the client and sales channel for this deal"
          />
          <div className="mt-6">
            <ClientInfoSection
              form={form}
              agencies={agencies}
              advertisers={advertisers}
              salesChannel={salesChannel}
              includeEmail={includeEmail}
              layout="stacked"
            />
          </div>
        </div>
        
        {/* Deal Timeline Section */}
        <div className="border-t pt-6 mt-8">
          <FormSectionHeader
            title="Deal Timeline"
            description="Configure the basic deal structure and timeline"
          />
          <div className="mt-6">
            <DealDetailsSection
              form={form}
              dealStructureType={dealStructureType}
              setDealStructure={setDealStructure}
              nextStep={nextStep}
              showBusinessSummary={false}
              showNavigationButton={showNavigation}
              title=""
              description=""
            />
          </div>
        </div>
      </div>
    );
  }

  // Deal Submission layout - using cards structure
  return (
    <>
      {/* Client Information Section */}
      <CardContent className="p-6 border-b">
        <FormSectionHeader
          title="Client Information"
          description="Select the client and sales channel for this deal"
        />
        <div className="mt-6">
          <ClientInfoSection
            form={form}
            agencies={agencies}
            advertisers={advertisers}
            salesChannel={salesChannel}
            includeEmail={includeEmail}
            layout="grid"
          />
        </div>
      </CardContent>

      {/* Deal Details Section */}
      <DealDetailsSection
        form={form}
        dealStructureType={dealStructureType}
        setDealStructure={setDealStructure}
        nextStep={nextStep}
        showBusinessSummary={true}
        showNavigationButton={showNavigation}
      />
    </>
  );
}