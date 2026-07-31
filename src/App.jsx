import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import { useLocation, Navigate } from "react-router-dom";
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
import { useUser } from "@clerk/clerk-react";
import { apiClient } from "@/api/client";
import { useEffect } from "react";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
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
  const { user, isLoaded } = useUser();
  
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
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
