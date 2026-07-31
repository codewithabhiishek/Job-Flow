import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Kanban from "@/pages/Kanban";
import CalendarPage from "@/pages/Calendar";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import AppLayout from "@/components/AppLayout";
import { apiClient } from "@/api/client";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { user, isLoaded, isDemoMode } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      apiClient.setUserId(user.id);
    }
  }, [user]);

  return (
    <LoadingScreen isLoaded={isLoaded}>
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-300 font-medium z-50 relative">
          ⚡ <strong>Demo / Development Mode:</strong> Auth is simulated so you can test features right away. Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>.env</code> when ready for production auth.
        </div>
      )}
      <Routes>
        <Route path="/" element={isDemoMode ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={isDemoMode ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isDemoMode ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LoadingScreen>
  );
};

const AppToaster = () => {
  const { theme } = useTheme();
  return (
    <Toaster 
      position="bottom-right" 
      theme={theme === 'system' ? 'system' : theme}
      toastOptions={{
        className: "bg-background border border-border/60 text-foreground shadow-premium dark:shadow-premium-dark rounded-[10px]"
      }}
    />
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="jobflow-theme">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <AppToaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
