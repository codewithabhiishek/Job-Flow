import React, { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  return (
    <AuthContext.Provider
      value={{
        user: user ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          avatar_url: user.imageUrl,
          first_name: user.firstName,
          last_name: user.lastName,
          ...user,
        } : null,
        isAuthenticated: !!isSignedIn,
        isLoadingAuth: !isLoaded,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: {},
        authChecked: isLoaded,
        logout: (shouldRedirect = true) => {
           if (shouldRedirect) clerk.signOut({ redirectUrl: window.location.href });
           else clerk.signOut();
        },
        navigateToLogin: () => {
           clerk.redirectToSignIn({ returnBackUrl: window.location.href });
        },
        checkUserAuth: () => {},
        checkAppState: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
