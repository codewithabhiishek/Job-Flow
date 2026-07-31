import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { ClerkProvider } from "@clerk/clerk-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-xl space-y-4">
            <h1 className="text-xl font-semibold text-red-400">Application Error</h1>
            <p className="text-sm text-neutral-300">
              A runtime error occurred. You can try refreshing the page or clearing your session to resolve this.
            </p>
            <div className="bg-neutral-950 p-3 rounded text-xs font-mono text-neutral-400 overflow-auto max-h-32">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white text-black text-sm font-medium py-2 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="flex-1 bg-neutral-800 text-white border border-neutral-700 text-sm font-medium py-2 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
