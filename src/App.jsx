import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import { apiClient } from "@/api/client";
import { Suspense, lazy, useEffect } from "react";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Kanban = lazy(() => import("@/pages/Kanban"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Settings = lazy(() => import("@/pages/Settings"));

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

const AuthenticatedApp = () => {
  const { user, isLoaded } = useAuth();
  
  // Auth setup is handled inside AuthProvider and apiClient.setToken

  return (
    <LoadingScreen isLoaded={isLoaded}>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
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
      </Suspense>
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
