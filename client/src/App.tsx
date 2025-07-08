import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect, lazy } from "react";
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
import { OnboardingProvider } from "@/contexts/onboarding-context";
import TourTooltip from "@/components/onboarding/tour-tooltip";
import FloatingMascot from "@/components/floating-mascot";
import Dashboard from "@/pages/dashboard";

import TemplatesContent from "@/components/templates-content";
import CyclesContent from "@/components/cycles-content";

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

import DailyFocusPage from "@/pages/daily-focus";
import PricingPage from "@/pages/pricing";
import OrganizationSettings from "@/pages/organization-settings";
import SystemAdmin from "@/pages/system-admin";
import ClientUserManagement from "@/pages/client-user-management";
import NotificationSettings from "@/pages/notification-settings";
import ClientRegistration from "@/pages/client-registration";
import SubscriptionPackageManagement from "@/pages/subscription-package-management";
import PackageDetail from "@/pages/package-detail";
import SystemOrganizationManagement from "@/pages/system-organization-management";
import AddOnsManagement from "@/pages/add-ons-management";
import SystemAddonManagement from "@/pages/system-addon-management";
import SystemSubscriptionManagement from "@/pages/system-subscription-management";
import InvoiceManagement from "@/pages/invoice-management";
import InvoiceDetail from "@/pages/invoice-detail";
import InvoicePaymentFinish from "@/pages/invoice-payment-finish";
import SubscriptionAddonIntegration from "@/pages/subscription-addon-integration";
import TrialSettingsPage from "@/pages/system-admin/trial-settings";
import DummyClientExamples from "@/pages/dummy-client-examples";
import ReferralCodes from "@/pages/referral-codes";
import TrialAchievements from "@/pages/trial-achievements";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [location] = useLocation();

  // Clear logout flag on app start if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem("isLoggedOut");
    }
  }, [isAuthenticated]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Redirect system owner to system admin dashboard by default
  useEffect(() => {
    if (isAuthenticated && user && (user as any)?.isSystemOwner) {
      // Only redirect if on root path
      if (location === "/" || location === "/daily-focus") {
        window.location.href = "/system-admin";
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
      <div className="min-h-screen bg-gray-50">
        {/* Global Header */}
        <GlobalHeader
          onMenuToggle={handleMenuToggle}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <ClientSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main layout with responsive margin to avoid overlap */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            // Desktop: Dynamic margin based on sidebar collapsed state, Mobile: full width (sidebar is overlay)
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", // 16 = 64px for collapsed, 64 = 256px for expanded
          )}
        >
          {/* Main Content */}
          <div className="flex-1 min-h-[calc(100vh-4rem)] py-3 overflow-x-hidden">
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
              <Route path="/cycles">
                <CyclesContent />
              </Route>
              <Route path="/templates">
                <TemplatesContent />
              </Route>
              <Route path="/achievements" component={AchievementsPage} />
              <Route path="/trial-achievements" component={TrialAchievements} />
              <Route path="/analytics" component={AnalyticsPage} />

              <Route path="/pricing" component={PricingPage} />
              <Route
                path="/organization-settings"
                component={OrganizationSettings}
              />
              <Route path="/system-admin" component={SystemAdmin} />
              <Route
                path="/system-admin/organizations"
                component={SystemOrganizationManagement}
              />
              <Route path="/client-users" component={ClientUserManagement} />
              <Route
                path="/notification-settings"
                component={NotificationSettings}
              />
              <Route path="/register" component={ClientRegistration} />
              <Route
                path="/subscription-packages"
                component={SubscriptionPackageManagement}
              />
              <Route path="/package-detail/:id" component={PackageDetail} />
              <Route path="/add-ons" component={AddOnsManagement} />
              <Route
                path="/system-admin/add-ons"
                component={SystemAddonManagement}
              />
              <Route
                path="/system-admin/trial-settings"
                component={TrialSettingsPage}
              />
              <Route
                path="/system-admin/subscriptions"
                component={SystemSubscriptionManagement}
              />
              <Route path="/subscription-addon-integration">
                <SubscriptionAddonIntegration />
              </Route>
              <Route path="/dummy-client-examples">
                <DummyClientExamples />
              </Route>
              <Route path="/referral-codes" component={ReferralCodes} />
              <Route path="/invoices" component={InvoiceManagement} />
              <Route path="/invoices/:id" component={InvoiceDetail} />
              <Route
                path="/invoice-payment-finish"
                component={InvoicePaymentFinish}
              />
              <Route component={NotFound} />
            </Switch>
          </div>
        </div>
        
        {/* Floating Mascot - appears on all pages */}
        <FloatingMascot />
      </div>
    </NotificationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingProvider>
          <Toaster />
          <Router />
          <TourTooltip />
        </OnboardingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
