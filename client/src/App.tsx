import { Switch, Route, useLocation, useRouter } from "wouter";
import { useState, useEffect, useMemo, lazy } from "react";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import GlobalHeader from "@/components/global-header";
import TrialStatusHeader from "@/components/trial-status-header";
import ClientSidebar from "@/components/client-sidebar";
import SystemAdminSidebar from "@/components/system-admin-sidebar";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import TourSystemNew from "@/components/TourSystemNew";

import Dashboard from "@/pages/dashboard";

import TemplatesContent from "@/components/templates-content";
import CyclesContent from "@/components/cycles-content";

import KeyResultDetail from "@/pages/key-result-detail";
import InitiativeDetail from "@/pages/initiative-detail";
import ObjectiveDetail from "@/pages/objective-detail";
import ProjectDetail from "@/pages/project-detail";
import TaskDetail from "@/pages/task-detail";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AnalyticsPage from "@/pages/analytics";
import AchievementsPage from "@/pages/achievements";

import DailyFocusPage from "@/pages/daily-focus";
import TasksPage from "@/pages/tasks";
import TimelinePage from "@/pages/timeline";
import HelpPage from "@/pages/help";

import OrganizationSettings from "@/pages/organization-settings";
import SystemAdmin from "@/pages/system-admin";
import ClientUserManagement from "@/pages/client-user-management";
import NotificationSettings from "@/pages/notification-settings";

import ClientRegistration from "@/pages/client-registration";
import Registration from "@/pages/registration";
import EmailVerification from "@/pages/email-verification";
import SubscriptionPackageManagement from "@/pages/subscription-package-management";
import PackageDetail from "@/pages/package-detail";
import SystemOrganizationManagement from "@/pages/system-organization-management";
import AddOnsManagement from "@/pages/add-ons-management";
import SystemAddonManagement from "@/pages/system-addon-management";
import SystemSubscriptionManagement from "@/pages/system-subscription-management";

import InvoicePaymentFinish from "@/pages/invoice-payment-finish";
import InvoiceManagement from "@/pages/invoice-management";
import InvoiceDetail from "@/pages/invoice-detail";
import SubscriptionAddonIntegration from "@/pages/subscription-addon-integration";

import DummyClientExamples from "@/pages/dummy-client-examples";
import ReferralCodes from "@/pages/referral-codes";

import CompanyOnboardingSimple from "@/pages/company-onboarding-simple";
import OrganizationSetup from "@/pages/organization-setup";
import GuidedOnboarding from "@/pages/guided-onboarding";
import CompanyOnboarding from "@/pages/company-onboarding";

import ClientStatusMapping from "@/pages/client-status-mapping";
import ApplicationSettings from "@/pages/system-admin/application-settings";
import AcceptInvitation from "@/pages/accept-invitation";
import TestToast from "@/pages/test-toast";
import UpgradePackage from "@/pages/upgrade-package";
import TemplateManagement from "@/pages/template-management";
import TemplateDetail from "@/pages/template-detail";
import ClientTemplates from "@/components/ClientTemplates";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [location, navigate] = useLocation();

  // Check trial status for dynamic content positioning
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
    enabled: isAuthenticated && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes cache (increased from 1 minute)
    refetchOnWindowFocus: false, // Prevent unnecessary refetch on focus
  });

  // Check onboarding status for redirect (efficient version)
  const { data: onboardingStatus } = useQuery({
    queryKey: ["/api/onboarding/status"],
    enabled: isAuthenticated && !isLoading && location === "/",
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime in v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Clear logout flag on app start if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem("isLoggedOut");
    }
  }, [isAuthenticated]);

  // Handle onboarding redirect - prioritize server status over localStorage
  useEffect(() => {
    if (isAuthenticated && !isLoading && location === "/") {
      // Check server onboarding status first
      if (onboardingStatus !== undefined) {
        const serverOnboardingCompleted = (onboardingStatus as any)?.isCompleted;
        
        // If server says onboarding not completed, redirect to guided onboarding
        if (!serverOnboardingCompleted) {
          console.log("🔄 Server onboarding not completed, redirecting to company onboarding page");
          navigate("/company-onboarding");
          return;
        }
      } else {
        // Fallback to localStorage if server status not available yet
        const localOnboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
        if (!localOnboardingCompleted) {
          console.log("🎯 Local onboarding not completed, redirecting to company onboarding page");
          navigate("/company-onboarding");
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, location, onboardingStatus, navigate]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Only redirect system owner to system admin dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isLoading && (user as any)?.isSystemOwner) {
      if (location === "/" || location === "/daily-focus") {
        navigate("/system-admin");
      }
    }
  }, [isAuthenticated, user, isLoading, location, navigate]);

  // Show loading only on initial load, not on navigation
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
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
        <Route path="/register" component={Register} />
        <Route path="/registration" component={Registration} />
        <Route path="/verify-email" component={EmailVerification} />
        <Route path="/email-verification" component={EmailVerification} />
        <Route path="/client-registration" component={ClientRegistration} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/accept-invitation" component={AcceptInvitation} />
        <Route path="/test-toast" component={TestToast} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Check if current route is onboarding
  const isOnboardingPage = location === "/onboarding" || location === "/guided-onboarding" || location === "/company-onboarding";

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Trial Status Header - Shows above main header - Hide on onboarding */}
        {!isOnboardingPage && <TrialStatusHeader />}

        {/* Global Header - Always show */}
        <GlobalHeader
          onMenuToggle={handleMenuToggle}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Sidebar - Hide on onboarding */}
        {!isOnboardingPage && (
          <>
            {/* System Owner uses SystemAdminSidebar */}
            {(user as any)?.isSystemOwner ? (
              <SystemAdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            ) : (
              <ClientSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            )}
          </>
        )}

        {/* Main layout with responsive margin to avoid overlap */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            // Desktop: Dynamic margin based on sidebar collapsed state, Mobile: full width (sidebar is overlay)
            // No margin on onboarding page
            !isOnboardingPage && (sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"), // 16 = 64px for collapsed, 64 = 256px for expanded
          )}
        >
          {/* Main Content */}
          <div
            className={cn(
              "flex-1 min-h-[calc(100vh-6rem)] py-3 overflow-x-hidden",
              // Different padding for onboarding page and trial status
              isOnboardingPage
                ? "pt-[64px] px-0" // Just header space for onboarding
                : (trialStatus as any)?.isTrialActive && !(user as any)?.isSystemOwner
                  ? "pt-[130px] sm:pt-[130px] px-3 sm:px-6" // Header (64px) + Trial Header (44px)
                  : "pt-[64px] sm:pt-[64px] px-3 sm:px-6", // Just header
            )}
          >
            <Switch>
              <Route path="/onboarding" component={CompanyOnboardingSimple} />
              <Route path="/company-onboarding" component={CompanyOnboarding} />
              <Route path="/organization-setup" component={OrganizationSetup} />
              <Route path="/" component={DailyFocusPage} />
              <Route path="/daily-focus" component={DailyFocusPage} />
              <Route path="/tasks" component={TasksPage} />
              <Route path="/timeline" component={TimelinePage} />
              <Route path="/goals" component={Dashboard} />
              <Route path="/home" component={Home} />
              <Route path="/profile" component={Profile} />

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

              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/help" component={HelpPage} />

              <Route path="/upgrade-package" component={UpgradePackage} />

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
                path="/system-admin/client-status-mapping"
                component={ClientStatusMapping}
              />
              <Route
                path="/system-admin/application-settings"
                component={ApplicationSettings}
              />
              <Route
                path="/system-admin/template-management"
                component={TemplateManagement}
              />
              <Route
                path="/template-management"
                component={TemplateManagement}
              />
              <Route
                path="/goal-templates"
                component={ClientTemplates}
              />
              <Route
                path="/template/:id"
                component={TemplateDetail}
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
              <Route path="/test-toast" component={TestToast} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </div>
      </div>
      <TourSystemNew />
    </NotificationProvider>
  );
}

function App() {
  // Global error handling for runtime errors
  useEffect(() => {
    const handleGlobalError = (e: ErrorEvent) => {
      // Suppress common non-critical errors
      if (e.message && typeof e.message === 'string') {
        if (e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
            e.message.includes("Cannot read properties of undefined (reading 'frame')") ||
            e.message.includes("Non-Error promise rejection captured")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      // Suppress ResizeObserver related rejections
      if (e.reason && String(e.reason).includes("ResizeObserver")) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    
    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

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
