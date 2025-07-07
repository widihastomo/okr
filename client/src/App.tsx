import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import GlobalHeader from "@/components/global-header";
import ClientSidebar from "@/components/client-sidebar";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import Dashboard from "@/pages/dashboard";
import CyclesPage from "@/components/cycles-page";
import TemplatesPage from "@/components/templates-page";

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
import NetworkVisualization from "@/pages/network-visualization";
import DailyFocusPage from "@/pages/daily-focus";
import PricingPage from "@/pages/pricing";
import OrganizationSettings from "@/pages/organization-settings";
import SystemAdmin from "@/pages/system-admin";
import UserManagement from "@/pages/user-management";
import ClientRoleManagement from "@/pages/client-role-management";
import ClientUserManagement from "@/pages/client-user-management";
import NotificationSettings from "@/pages/notification-settings";
import ClientRegistration from "@/pages/client-registration";




function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();

  // Clear logout flag on app start if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem('isLoggedOut');
    }
  }, [isAuthenticated]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Redirect system owner to system admin dashboard by default
  useEffect(() => {
    if (isAuthenticated && user && (user as any)?.isSystemOwner) {
      // Only redirect if on root path
      if (location === '/' || location === '/daily-focus') {
        window.location.href = '/system-admin';
      }
    }
  }, [isAuthenticated, user, location]);

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
        <Route path="/register" component={ClientRegistration} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50">
        <ClientSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main layout with responsive margin to avoid overlap */}
        <div className={cn(
          "flex-1 flex flex-col",
          // Desktop: Dynamic margin based on sidebar collapsed state, Mobile: full width (sidebar is overlay)
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64" // 16 = 64px for collapsed, 64 = 256px for expanded
        )}>
          {/* Global Header */}
          <GlobalHeader onMenuToggle={handleMenuToggle} sidebarOpen={sidebarOpen} />
          
          {/* Main Content */}
          <div className="flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden">
            <div className="p-4">
              <Switch>
                <Route path="/" component={DailyFocusPage} />
                <Route path="/daily-focus" component={DailyFocusPage} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/home" component={Home} />
                <Route path="/profile" component={Profile} />
                <Route path="/company-okr" component={CompanyOKRPage} />
                <Route path="/key-results/:id" component={KeyResultDetail} />
                <Route path="/initiatives/:id" component={InitiativeDetail} />
                <Route path="/objectives/:id" component={ObjectiveDetail} />
                <Route path="/projects/:id" component={ProjectDetail} />
                <Route path="/task/:id" component={TaskDetail} />
                <Route path="/tasks/:id" component={TaskDetail} />
                <Route path="/cycles" component={CyclesPage} />
                <Route path="/templates" component={TemplatesPage} />
                <Route path="/achievements" component={AchievementsPage} />
                <Route path="/analytics" component={AnalyticsPage} />
                <Route path="/network" component={NetworkVisualization} />
                <Route path="/pricing" component={PricingPage} />
                <Route path="/organization-settings" component={OrganizationSettings} />
                <Route path="/system-admin" component={SystemAdmin} />
                <Route path="/user-management" component={UserManagement} />
                <Route path="/client-users" component={ClientUserManagement} />
                <Route path="/role-management" component={ClientRoleManagement} />
                <Route path="/notification-settings" component={NotificationSettings} />
                <Route path="/register" component={ClientRegistration} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
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
