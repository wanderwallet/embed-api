import { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
