"use client";

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "client";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string;
  phone?: string;
  avatar_url?: string;
  notification_preferences?: Record<string, unknown>;
  appearance_settings?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserFromAuth(supabaseUser: SupabaseUser): AppUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: meta.name ?? meta.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
    role: "client",
    avatar_url: meta.avatar_url,
  };
}

async function fetchAppUser(supabaseUser: SupabaseUser): Promise<AppUser> {
  const supabase = createSupabaseBrowserClient();

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", supabaseUser.id)
    .maybeSingle();

  if (!data) {
    console.warn("[Auth] User not found in public.users → creating...");
    const { error: insertError } = await supabase.from("users").upsert({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name:
        supabaseUser.user_metadata?.name ||
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.email?.split("@")[0],
      role: "client",
    });
    if (insertError) console.error("User creation failed:", insertError.message);

    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      name: supabaseUser.email?.split("@")[0] ?? "User",
      role: "client",
    };
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    clientId: data.client_id,
    phone: data.phone,
    avatar_url: data.avatar_url,
    notification_preferences: data.notification_preferences,
    appearance_settings: data.appearance_settings,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    lastLogin: data.last_login ? new Date(data.last_login) : undefined,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // login() ne already user set kar diya — onAuthStateChange ko skip karne ke liye
  const skipNextAuthChange = useRef(false);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleSession = useCallback(
    async (supabaseUser: SupabaseUser | null) => {
      if (!supabaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const appUser = await fetchAppUser(supabaseUser);
        setUser(appUser);
      } catch (err) {
        console.error("[AuthContext] handleSession error:", err);
        setUser(buildUserFromAuth(supabaseUser));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // login() ke baad SIGNED_IN event aata hai — skip karo
      // kyunki login() ne already optimistic user set kar diya hai
      if (event === "SIGNED_IN" && skipNextAuthChange.current) {
        skipNextAuthChange.current = false;
        return;
      }

      // SIGNED_OUT aur baaki events normally handle karo
      handleSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [handleSession, supabase]);

  // ─── login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error("Email and password are required");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(
          error.message.includes("Email not confirmed")
            ? "Email not confirmed. Please check your inbox."
            : "Invalid email or password."
        );
      }
      if (data.user) {
        // onAuthStateChange ko skip karo — hum khud manage kar rahe hain
        skipNextAuthChange.current = true;

        // Turant optimistic user set karo — koi DB wait nahi
        setUser(buildUserFromAuth(data.user));

        // Background mein full profile fetch karo — re-render hoga par tab
        // user dashboard par hoga, flash nahi hoga
        fetchAppUser(data.user)
          .then(setUser)
          .catch(() => { /* buildUserFromAuth already set hai */ });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.replace("/login");
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("[AuthContext] logout failed:", error);
      toast.error("Logout failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── forgotPassword ──────────────────────────────────────────────────────────
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/callback?next=/reset-password`,
      });
      if (error) throw new Error(error.message);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error) {
      console.error("[AuthContext] forgotPassword failed:", error);
      toast.error("Failed to send reset email. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── resetPassword ───────────────────────────────────────────────────────────
  const resetPassword = async (password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      toast.success("Password updated successfully. Please sign in.");
      router.replace("/login");
    } catch (error) {
      console.error("[AuthContext] resetPassword failed:", error);
      toast.error("Failed to reset password. The link may have expired.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, forgotPassword, resetPassword }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}