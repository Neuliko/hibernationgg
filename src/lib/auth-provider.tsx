import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    // Allow the app to render without Clerk configured. Pages that need auth
    // will show a friendly setup banner instead of crashing.
    return <>{children}</>;
  }
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "oklch(0.72 0.21 295)",
          colorBackground: "oklch(0.14 0.03 280)",
          colorText: "oklch(0.97 0.01 250)",
          colorInputBackground: "oklch(0.2 0.03 280)",
          colorInputText: "oklch(0.97 0.01 250)",
          borderRadius: "0.875rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export const isClerkConfigured = !!PUBLISHABLE_KEY;
