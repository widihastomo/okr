import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import CyclesPage from "@/components/cycles-page";
import TemplatesPage from "@/components/templates-page";
import UsersPage from "@/components/users-page";
import CompanyOKRsPage from "@/pages/company-okrs";
import KeyResultDetail from "@/pages/key-result-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/company-okrs" component={CompanyOKRsPage} />
      <Route path="/key-results/:id" component={KeyResultDetail} />
      <Route path="/cycles" component={CyclesPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
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
