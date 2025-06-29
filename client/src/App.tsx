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
import Dashboard from "@/pages/dashboard";
import CyclesPage from "@/components/cycles-page";
import TemplatesPage from "@/components/templates-page";
import UsersPage from "@/components/users-page";
import CompanyOKRPage from "@/pages/company-okr";
import KeyResultDetail from "@/pages/key-result-detail";
import InitiativeDetail from "@/pages/initiative-detail";
import ObjectiveDetail from "@/pages/objective-detail";
import ProjectDetail from "@/pages/project-detail";
import TaskDetail from "@/pages/task-detail";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AnalyticsPage from "@/pages/analytics";
import AchievementsPage from "@/pages/achievements";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Clear logout flag on app start if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem('isLoggedOut');
    }
  }, [isAuthenticated]);

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
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className={cn(
          "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300",
          // Mobile: no margin left (sidebar is overlay)
          "ml-0",
          // Desktop: margin based on sidebar state
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/home" component={Home} />
            <Route path="/profile" component={Profile} />
            <Route path="/company-okr" component={CompanyOKRPage} />
            <Route path="/key-results/:id" component={KeyResultDetail} />
            <Route path="/initiatives/:id" component={InitiativeDetail} />
            <Route path="/objectives/:id" component={ObjectiveDetail} />
            <Route path="/projects/:id" component={ProjectDetail} />
            <Route path="/tasks/:taskId" component={TaskDetail} />
            <Route path="/cycles" component={CyclesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/users" component={UsersPage} />
            <Route path="/achievements" component={AchievementsPage} />
            <Route path="/analytics" component={AnalyticsPage} />
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
