import React, { createContext, useContext, useEffect } from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { apiClient } from "@/api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  
  // Sync setting of getToken to prevent race conditions in child components' effects
  if (isSignedIn && getToken) {
    apiClient.setGetTokenFn(getToken);
  } else {
    apiClient.setGetTokenFn(null);
  }

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
