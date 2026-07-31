import React, { createContext, useContext, useEffect } from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { apiClient } from "@/api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();

  useEffect(() => {
    const updateToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          apiClient.setToken(token);
        } catch (error) {
          console.error("Failed to fetch Clerk token", error);
        }
      } else {
        apiClient.setToken(null);
      }
    };
    updateToken();
  }, [isSignedIn, getToken]);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
