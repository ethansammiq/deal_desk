import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SubmitDeal from "@/pages/SubmitDeal";
import RequestSupport from "@/pages/RequestSupport";
import HelpResources from "@/pages/HelpResources";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ChatProvider } from "@/lib/chat-context";
import FloatingChatbot from "@/components/FloatingChatbot";
import { PageTransition } from "@/components/ui/page-transition";
import { SmartSearch } from "@/components/SmartSearch";

function AppLayout({ children }: { children: React.ReactNode }) {
  // Get the current path to determine special styling for certain pages
  const currentPath = window.location.pathname;
  const isSupportPage = currentPath === "/support";
  const isSubmitDealPage = currentPath === "/submit-deal";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNavbar />
      
      {/* Main Content Area with Fixed Width */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-[#f8f5ff] to-slate-50 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          {isSupportPage || isSubmitDealPage ? (
            // For the RequestSupport and SubmitDeal pages, don't add the white background container
            <div className="max-w-full">
              {children}
            </div>
          ) : (
            // For all other pages, use the standard white background container
            <div className="bg-white rounded-lg shadow-sm border border-[#f0e6ff] p-4 sm:p-6">
              <div className="max-w-full">
                {children}
              </div>
            </div>
          )}
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
    <AppLayout>
      <Switch>
        <Route path="/" component={HelpResources} />
        <Route path="/support" component={RequestSupport} />
        <Route path="/submit-deal" component={SubmitDeal} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/help" component={HelpResources} /> {/* Keep support for old URL */}
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
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
  );
}

export default App;
