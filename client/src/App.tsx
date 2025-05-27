import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { getAuthToken } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import DemoDashboard from "@/pages/demo-dashboard";

// Update queryClient to include auth headers
queryClient.setDefaultOptions({
  queries: {
    queryFn: async ({ queryKey }) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Clear invalid token
          localStorage.removeItem("auth_token");
          throw new Error("Unauthorized");
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
  },
  mutations: {
    retry: false,
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/demo" component={DemoDashboard} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Redirect to="/demo" />
      </Route>
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
