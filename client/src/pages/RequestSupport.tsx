import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

// Create a schema for support requests
const supportRequestSchema = z.object({
  supportType: z.string().min(1, "Support type is required"),
  requestTitle: z.string().min(1, "Request title is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  relatedDealId: z.number().optional(),
  priorityLevel: z.string().default("medium"),
  deadline: z.string().optional(),
});

type SupportRequestFormValues = z.infer<typeof supportRequestSchema>;

export default function RequestSupport() {
  const { toast } = useToast();
  
  // Fetch deals for the dropdown
  const { data: deals } = useQuery({
    queryKey: ['/api/deals'],
  });
  
  const form = useForm<SupportRequestFormValues>({
    resolver: zodResolver(supportRequestSchema),
    defaultValues: {
      supportType: "",
      requestTitle: "",
      description: "",
      priorityLevel: "medium",
      deadline: format(new Date(), "yyyy-MM-dd")
    },
    mode: "onChange"
  });
  
  // Create support request mutation
  const createSupportRequest = useMutation({
    mutationFn: async (data: SupportRequestFormValues) => {
      const response = await apiRequest("POST", "/api/support-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-requests'] });
      toast({
        title: "Success",
        description: "Support request submitted successfully!",
        variant: "default",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit support request",
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: SupportRequestFormValues) {
    createSupportRequest.mutate(data);
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Request Deal Support</h1>
        <p className="mt-1 text-sm text-slate-500">Get help with scoping, pricing, or technical aspects of your deals</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Support Request Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Support Request Form</h3>
            </div>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="supportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Type <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select support type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pricing">Pricing Assistance</SelectItem>
                            <SelectItem value="technical">Technical Scoping</SelectItem>
                            <SelectItem value="legal">Legal Review</SelectItem>
                            <SelectItem value="proposal">Proposal Development</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requestTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter request title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide detailed information about your request"
                            className="resize-none"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Please provide detailed information about your request.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="relatedDealId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Deal</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a deal or leave blank" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Select a deal or leave blank</SelectItem>
                              {deals?.map((deal: any) => (
                                <SelectItem key={deal.id} value={deal.id.toString()}>
                                  {deal.dealName} (#{deal.referenceNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priorityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline (if applicable)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Attachments</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-slate-600">
                          <label htmlFor="support-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500">
                            <span>Upload files</span>
                            <input id="support-file-upload" name="support-file-upload" type="file" className="sr-only" multiple />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          PDF, DOC, XLS, PNG up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={createSupportRequest.isPending}>
                      {createSupportRequest.isPending ? "Submitting..." : "Submit Support Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Help & Support Info */}
        <div className="lg:col-span-1">
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Support Resources</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Response Times</h4>
                  <ul className="mt-2 text-sm text-slate-600 space-y-2">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      <span>High Priority: 1 business day</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span>Medium Priority: 2-3 business days</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>Low Priority: 3-5 business days</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Support Team Contacts</h4>
                  <ul className="mt-2 text-sm text-slate-600 space-y-2">
                    <li>
                      <span className="font-medium">Pricing Team:</span> pricing@dealdesk.com
                    </li>
                    <li>
                      <span className="font-medium">Technical Team:</span> technical@dealdesk.com
                    </li>
                    <li>
                      <span className="font-medium">Legal Team:</span> legal@dealdesk.com
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-slate-900">Helpful Resources</h4>
                  <ul className="mt-2 space-y-2">
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Pricing Guidelines PDF</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Technical Implementation Guide</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Legal & Contract Templates</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Discount Approval Workflow</a>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-900">Need Urgent Help?</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    For time-sensitive inquiries related to active deals, please contact your regional deal desk manager directly.
                  </p>
                  <Button variant="outline" className="mt-3 w-full">
                    Find Your Deal Desk Manager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
