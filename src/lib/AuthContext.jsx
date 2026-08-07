import React, { createContext, useContext, useEffect } from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { apiClient } from "@/api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();

  // Keep the API token in sync with the session. Done in an effect (not during
  // render) to avoid a side-effect in the render phase.
  useEffect(() => {
    if (isSignedIn && getToken) {
      apiClient.setGetTokenFn(getToken);
    } else {
      apiClient.setGetTokenFn(null);
    }
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
