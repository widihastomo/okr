import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import GlobalHeader from "@/components/global-header";
import ClientSidebar from "@/components/client-sidebar";
import SystemAdminSidebar from "@/components/system-admin-sidebar";
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




function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // Determine if user is system owner (platform admin) or client user
  const isSystemOwner = (user as any)?.isSystemOwner || false;

  // Render different layouts for system owners vs client users
  if (isSystemOwner) {
    // System Owner Layout - Only system admin features
    return (
      <div className="min-h-screen bg-gray-900">
        {/* System Admin Header */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-700 text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-white">System Administration</h1>
          </div>
          <div className="text-sm text-gray-400">
            Logged in as: {(user as any)?.email}
          </div>
        </div>
        
        <div className="flex pt-0">
          {/* System Admin Sidebar */}
          <SystemAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* System Admin Content */}
          <div className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 overflow-x-hidden",
            "ml-0 lg:ml-64"
          )}>
            <Switch>
              <Route path="/system-admin" component={SystemAdmin} />
              <Route path="/user-management" component={UserManagement} />
              <Route path="/system-admin/organizations" component={SystemAdmin} />
              <Route path="/system-admin/subscriptions" component={SystemAdmin} />
              <Route path="/system-admin/settings" component={SystemAdmin} />
              <Route path="/system-admin/database" component={SystemAdmin} />
              <Route path="/system-admin/security" component={SystemAdmin} />
              <Route path="/system-admin/notifications" component={SystemAdmin} />
              {/* Redirect any non-system routes to system admin dashboard */}
              <Route component={() => {
                window.location.href = '/system-admin';
                return null;
              }} />
            </Switch>
          </div>
        </div>
      </div>
    );
  }

  // Client User Layout - Normal OKR application features
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Global Header */}
        <GlobalHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        
        <div className="flex pt-16">
          {/* Client Sidebar */}
          <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main Content */}
          <div className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 overflow-x-hidden",
            "ml-0 lg:ml-64"
          )}>
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
              {/* Block access to system admin routes for client users */}
              <Route path="/system-admin" component={() => {
                window.location.href = '/';
                return null;
              }} />
              <Route path="/user-management" component={() => {
                window.location.href = '/';
                return null;
              }} />
              <Route component={NotFound} />
            </Switch>
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
