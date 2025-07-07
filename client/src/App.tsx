import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import GlobalHeader from "@/components/global-header";
import Sidebar from "@/components/sidebar";
import ClientSidebar from "@/components/client-sidebar";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
  const [location] = useLocation();

  // Clear logout flag on app start if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem('isLoggedOut');
    }
  }, [isAuthenticated]);

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

  // System admin users should use the old Sidebar for system administration
  const isSystemAdmin = user && (user as any)?.isSystemOwner;

  if (isSystemAdmin && location.startsWith('/system-admin')) {
    return (
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Global Header */}
          <GlobalHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
          
          <div className="flex pt-16">
            {/* System Admin Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main Content */}
            <div className={cn(
              "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 overflow-x-hidden",
              "ml-0",
              sidebarOpen ? "lg:ml-64" : "lg:ml-0"
            )}>
              <Switch>
                <Route path="/system-admin" component={SystemAdmin} />
                <Route path="/user-management" component={UserManagement} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </div>
        </div>
      </NotificationProvider>
    );
  }

  // Regular client users get the new collapsible sidebar
  return (
    <NotificationProvider>
      <SidebarProvider defaultOpen={true} storageKey="client-sidebar">
        <div className="min-h-screen bg-gray-50 flex">
          {/* Client Sidebar with collapsible icons */}
          <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main Content */}
          <SidebarInset className="flex-1">
            {/* Global Header */}
            <GlobalHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
            
            <div className="pt-16 min-h-[calc(100vh-4rem)]">
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
                <Route path="/client-users" component={ClientUserManagement} />
                <Route path="/role-management" component={ClientRoleManagement} />
                <Route path="/notification-settings" component={NotificationSettings} />
                <Route path="/register" component={ClientRegistration} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
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
