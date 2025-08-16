import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileTextIcon, 
  BuildingIcon, 
  TrendingUpIcon, 
  ClipboardIcon, 
  LifeBuoyIcon, 
  MessageSquareIcon
} from "lucide-react";

export default function HelpResources() {
  const [activeTab, setActiveTab] = useState("guides");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Support & Resources</h1>
          <p className="text-slate-600 mt-2">Get help with deals, find documentation, and access training materials</p>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-[#3e0075]" />
                Deal Submission Guide
              </CardTitle>
              <CardDescription>
                Complete walkthrough of the deal submission process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5 text-[#3e0075]" />
                Pricing Guidelines
              </CardTitle>
              <CardDescription>
                Learn about pricing models and discount thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5 text-[#3e0075]" />
                Approval Workflow
              </CardTitle>
              <CardDescription>
                Understand the approval process and timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardIcon className="h-5 w-5 text-[#3e0075]" />
                Contract Terms
              </CardTitle>
              <CardDescription>
                Reference guide for standard contract terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Reference
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoyIcon className="h-5 w-5 text-[#3e0075]" />
                Get Support
              </CardTitle>
              <CardDescription>
                Request help with deal scoping or technical questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#3e0075] hover:bg-[#2d0055]">
                Request Support
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareIcon className="h-5 w-5 text-[#3e0075]" />
                Contact Expert
              </CardTitle>
              <CardDescription>
                Connect with deal experts for complex situations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Contact Expert
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions about the deal process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">How long does deal approval take?</h4>
              <p className="text-sm text-slate-600">
                Approval timeline varies by deal size: Standard deals under $50K take 1-2 business days, 
                deals $50K-$250K take 2-4 days, and deals over $250K may take 5+ days.
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-900 mb-2">What information is required for deal submission?</h4>
              <p className="text-sm text-slate-600">
                You'll need client information, deal structure, financial details, contract terms, 
                and business justification. Use our deal submission form for guided input.
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-900 mb-2">Who should I contact for pricing questions?</h4>
              <p className="text-sm text-slate-600">
                For standard pricing, use our pricing calculator. For custom pricing or complex deals, 
                contact the deal desk team through the support form.
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-900 mb-2">How do I track my deal progress?</h4>
              <p className="text-sm text-slate-600">
                Visit the Analytics page to view all your deals and their current status. 
                You can also set up notifications for status changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}