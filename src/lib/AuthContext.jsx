import React, { createContext, useContext, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { apiClient } from "@/api/client";

const AuthContext = createContext();

const HAS_CLERK_KEY = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const MOCK_USER = {
  id: "user_demo_123",
  email: "demo@jobflow.dev",
  primaryEmailAddress: { emailAddress: "demo@jobflow.dev" },
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser",
  imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser",
  first_name: "Demo",
  firstName: "Demo",
  last_name: "User",
  lastName: "User",
  publicMetadata: { role: "admin" },
  role: "admin",
};

const ClerkAuthConsumer = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    if (user?.id) {
      apiClient.setUserId(user.id);
    }
  }, [user]);

  const value = {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          avatar_url: user.imageUrl,
          first_name: user.firstName,
          last_name: user.lastName,
          ...user,
        }
      : null,
    isAuthenticated: !!isSignedIn,
    isSignedIn: !!isSignedIn,
    isLoadingAuth: !isLoaded,
    isLoaded,
    authError: null,
    isDemoMode: false,
    logout: (shouldRedirect = true) => {
      if (shouldRedirect) clerk.signOut({ redirectUrl: window.location.href });
      else clerk.signOut();
    },
    navigateToLogin: () => {
      clerk.redirectToSignIn({ returnBackUrl: window.location.href });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const MockAuthConsumer = ({ children }) => {
  useEffect(() => {
    apiClient.setUserId(MOCK_USER.id);
  }, []);

  const value = {
    user: MOCK_USER,
    isAuthenticated: true,
    isSignedIn: true,
    isLoadingAuth: false,
    isLoaded: true,
    authError: null,
    isDemoMode: true,
    logout: () => {
      alert("Running in Demo/Local Mode. Auth is simulated!");
    },
    navigateToLogin: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }) => {
  if (HAS_CLERK_KEY) {
    return <ClerkAuthConsumer>{children}</ClerkAuthConsumer>;
  }
  return <MockAuthConsumer>{children}</MockAuthConsumer>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
