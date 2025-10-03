import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import type { Business } from "@shared/schema";
import { Landing } from "@/pages/Landing";
import { BusinessOnboarding } from "@/pages/BusinessOnboarding";
import { EmployeeManagement } from "@/pages/EmployeeManagement";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: business, isLoading: businessLoading } = useQuery<Business | null>({
    queryKey: ["/api/business"],
    enabled: isAuthenticated,
  });

  if (authLoading || (isAuthenticated && businessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (!business) {
    return <BusinessOnboarding />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={EmployeeManagement} />
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
