import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SubmitDeal from "@/pages/SubmitDeal";
import RequestSupport from "@/pages/RequestSupport";
import HelpResources from "@/pages/HelpResources";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatProvider } from "@/lib/chat-context";
import FloatingChatbot from "@/components/FloatingChatbot";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Page Content */}
        <div className="overflow-auto h-full bg-slate-50">
          {children}
        </div>
      </div>
      
      {/* Floating chatbot UI - with full customization options */}
      <FloatingChatbot 
        title="Deal Assistant" 
        subtitle="Ask me about deals & incentives"
        primaryColor="#4f46e5" // Custom primary color (Indigo)
        bubblePosition="bottom-right" // Position: 'bottom-right', 'bottom-left', 'top-right', or 'top-left'
        bubbleSize="medium" // Size: 'small', 'medium', or 'large'
        showTimestamps={true} // Show message timestamps
        // avatarUrl="/path/to/avatar.png" // Optional custom avatar
      />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/submit-deal" component={SubmitDeal} />
        <Route path="/support" component={RequestSupport} />
        <Route path="/help" component={HelpResources} />
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
        welcomeMessage: "👋 Welcome to the MIQ Deal Assistant! I'm here to help you navigate the commercial deal process, understand incentive programs, and guide you through deal submission and approval workflows. How can I assist you today?",
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
