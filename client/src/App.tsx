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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
