import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageLoading } from "@/components/ui/loading-states";
import { lazy, Suspense } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ChatProvider } from "@/lib/chat-context";
import FloatingChatbot from "@/components/FloatingChatbot";
import { PageTransition } from "@/components/ui/page-transition";
import { SmartSearch } from "@/components/SmartSearch";

// Lazy load pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const UnifiedDashboard = lazy(() => import("@/pages/UnifiedDashboard"));
const DealDetails = lazy(() => import("@/pages/DealDetails"));
const SubmitDeal = lazy(() => import("@/pages/SubmitDeal"));
const RequestSupport = lazy(() => import("@/pages/RequestSupport"));
const HelpResources = lazy(() => import("@/pages/HelpResources"));
const DealRequests = lazy(() => import("@/pages/DealRequests"));
const RoleDemo = lazy(() => import("@/pages/RoleDemo"));
const RoleTestingPanel = lazy(() => import("@/components/testing/RoleTestingPanel"));
const DepartmentQueues = lazy(() => import("@/pages/DepartmentQueues"));
const SLAMonitoring = lazy(() => import("@/pages/SLAMonitoring"));

// Legacy routes disabled - components archived as .legacy files

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f5ff] to-slate-50">
      <TopNavbar />
      
      {/* Main Content Area with Fixed Width */}
      <div className="pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div>
            {children}
          </div>
        </div>
      </div>
      
      {/* Floating chatbot UI - with full customization options */}
      <FloatingChatbot 
        title="DealGenie" 
        subtitle="Ask me about deals & approvals"
        primaryColor="#3e0075" // Deep purple to match our theme
        bubblePosition="bottom-right" 
        bubbleSize="medium" 
        showTimestamps={true}
      />
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <AppLayout>
        <Suspense fallback={<PageLoading title="Loading page..." />}>
          <Switch>
            <Route path="/" component={UnifiedDashboard} />
            <Route path="/support" component={RequestSupport} />
            <Route path="/request-support" component={RequestSupport} />
            <Route path="/submit-deal" component={SubmitDeal} />
            <Route path="/dashboard" component={UnifiedDashboard} />
            <Route path="/help" component={HelpResources} />
            <Route path="/deals" component={UnifiedDashboard} />
            <Route path="/deals/:id" component={DealDetails} />
            <Route path="/deal-requests" component={DealRequests} />
            <Route path="/role-demo" component={RoleDemo} />
            <Route path="/role-testing" component={RoleTestingPanel} />
            <Route path="/department-queues" component={DepartmentQueues} />
            <Route path="/sla-monitoring" component={SLAMonitoring} />
            {/* Legacy routes archived - components moved to .legacy files */}
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChatProvider config={{
          apiBasePath: '/api',
          // Custom welcome message for the chatbot
          welcomeMessage: "👋 Welcome to the Commercial Deal Desk! I'm DealGenie, your AI assistant. I'm here to help you navigate the commercial deal process, understand incentive programs, and guide you through deal submission and approval workflows. How can I assist you today?",
          // Default suggested questions
          defaultSuggestedQuestions: [
            "What is the deal process workflow?",
            "What financial incentives are available?",
            "How do I submit a new deal?",
            "What documentation is required?",
            "What are the eligibility requirements?",
            "How are urgent deals handled?"
          ],
          // Enable conversation persistence across page refreshes
          persistConversation: true,
          // Maximum number of messages to keep in history
          maxHistoryLength: 30,
          // Number of characters before showing auto-suggestions
          autoSuggestThreshold: 3,
          // AI model to use - 'simple' for keyword matching or 'advanced' for more detailed responses
          aiModel: 'advanced'
        }}>
          <Router />
          <Toaster />
        </ChatProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
