import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme-provider";
import { ProtectedRoute } from "@/lib/protected-route";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import BannedGuestsPage from "@/pages/banned-guests-page";
import GuestlistsPage from "@/pages/guestlists-page";
import ClubsPage from "@/pages/clubs-page";
import UsersPage from "@/pages/users-page";
import ChatPage from "@/pages/chat-page";
import UserSettingsPage from "@/pages/user-settings-page";
import PlatformSettingsPage from "@/pages/platform-settings-page";
import PluginsPage from "@/pages/plugins-page";
import NotFound from "@/pages/not-found";
import "./lib/i18n";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/banned-guests" component={BannedGuestsPage} />
      <ProtectedRoute path="/guestlists" component={GuestlistsPage} />
      <ProtectedRoute path="/clubs" component={ClubsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
