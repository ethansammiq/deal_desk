import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, FileText, ArrowRight, HelpCircle, Zap, Clock, Users, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormSectionHeader } from "@/components/ui/form-style-guide";

export default function DealRequests() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen">

      <div className="p-8 space-y-8">
        <FormSectionHeader
          title="Deal Requests"
          description="Choose the right option for your commercial deal needs"
        />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal Scoping Card */}
        <Card className="border-2 border-slate-200 hover:border-primary hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white inline-flex items-center justify-center p-2 rounded-lg mb-2">
              <HelpCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">New Deal Support</span>
            </div>
            <CardTitle className="text-xl">Deal Scoping Request</CardTitle>
            <CardDescription>
              For first-time users or complex deals requiring guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Ideal when you need assistance defining the structure, terms, or incentives for a new commercial deal. Our team will help scope and guide you through the deal creation process.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Receive expert help within 24-48 hours</span>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Collaborative process with deal desk specialists</span>
                </div>
                <div className="flex items-start">
                  <CheckSquare className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Ensure all requirements are met before formal submission</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Recommended for new users</span>
            </div>
            <Button onClick={() => setLocation("/request/scoping")} className="flex items-center">
              Start Scoping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Deal Submission Card */}
        <Card className="border-2 border-slate-200 hover:border-primary hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white inline-flex items-center justify-center p-2 rounded-lg mb-2">
              <Zap className="h-5 w-5 mr-2" />
              <span className="font-medium">Direct Submission</span>
            </div>
            <CardTitle className="text-xl">Deal Submission</CardTitle>
            <CardDescription>
              For experienced users with well-defined deal structures
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Submit a complete deal proposal directly when you already know your deal structure, terms, and incentives. Skip the scoping process and move straight to approval.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Complete all deal details in one streamlined process</span>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Instantly visualize financial impacts and incentive structures</span>
                </div>
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-slate-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Faster approval process for standard deal structures</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded-full">For experienced users</span>
            </div>
            <Button onClick={() => setLocation("/request/proposal")} variant="default" className="flex items-center">
              Submit Deal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
        </div>

        {/* Decision Guide */}
      <div className="mt-8">
        <Tabs defaultValue="comparison">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Which option should I choose?</CardTitle>
                <CardDescription>
                  Compare both options to determine the best fit for your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 pr-4 font-medium text-slate-500">Feature</th>
                        <th className="text-left pb-2 px-4 font-medium text-slate-500">Deal Scoping</th>
                        <th className="text-left pb-2 pl-4 font-medium text-slate-500">Direct Submission</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 pr-4 text-sm font-medium">Best for</td>
                        <td className="py-3 px-4 text-sm">First-time users, complex deals</td>
                        <td className="py-3 pl-4 text-sm">Experienced users, standard deals</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pr-4 text-sm font-medium">Process Time</td>
                        <td className="py-3 px-4 text-sm">2-3 days (includes scoping)</td>
                        <td className="py-3 pl-4 text-sm">1-2 days for approval</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pr-4 text-sm font-medium">Assistance Level</td>
                        <td className="py-3 px-4 text-sm">High (expert guidance provided)</td>
                        <td className="py-3 pl-4 text-sm">Self-service with AI assistance</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pr-4 text-sm font-medium">Flexibility</td>
                        <td className="py-3 px-4 text-sm">Highly customizable with expert input</td>
                        <td className="py-3 pl-4 text-sm">Standard templates with some flexibility</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 text-sm font-medium">Required Information</td>
                        <td className="py-3 px-4 text-sm">Basic deal concept and objectives</td>
                        <td className="py-3 pl-4 text-sm">Complete deal structure and terms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions about the deal request process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">Can I switch from scoping to direct submission?</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Yes, once a deal has been scoped, you can use the direct submission process with the information gathered during scoping.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">How detailed does my initial request need to be?</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      For deal scoping, just provide high-level information about the client and objectives. For direct submission, you'll need complete details on structure, terms, and incentives.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">What if I'm not sure which incentives to offer?</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Use the deal scoping option. Our deal desk specialists will recommend appropriate incentives based on your deal objectives and client profile.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">Who approves my deal submission?</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      All deals are reviewed by a Managing Director. Non-standard deals or those exceeding certain thresholds also require Executive Committee approval.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}