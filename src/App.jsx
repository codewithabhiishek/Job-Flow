import { Toaster } from "@/components/ui/toaster";
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

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-neutral-400 rounded-full animate-spin"></div>
      </div>
    );
  }

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

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-neutral-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
