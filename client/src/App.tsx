import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import GlobalHeader from "@/components/global-header";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard-new";
import CyclesPage from "@/components/cycles-page";
import TemplatesPage from "@/components/templates-page";
import UsersPage from "@/components/users-page";
import CompanyOKRsPage from "@/pages/company-okrs";
import OKRStructurePage from "@/pages/okr-structure";
import KeyResultDetail from "@/pages/key-result-detail";
import ObjectiveDetail from "@/pages/objective-detail";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/landing" component={Landing} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header */}
      <GlobalHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className={cn(
          "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/home" component={Home} />
            <Route path="/profile" component={Profile} />
            <Route path="/company-okrs" component={CompanyOKRsPage} />
            <Route path="/okr-structure" component={OKRStructurePage} />
            <Route path="/key-results/:id" component={KeyResultDetail} />
            <Route path="/objectives/:id" component={ObjectiveDetail} />
            <Route path="/cycles" component={CyclesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/users" component={UsersPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
