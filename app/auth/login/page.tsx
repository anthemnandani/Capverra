"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const supabase = createSupabaseBrowserClient();

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          toast.error(signUpError.message);
          return;
        }

        const user = signUpData.user;

        if (user) {
          await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            name: user.email?.split("@")[0],
            role: "client",
          });
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          toast.success("Account created! Please sign in.");
          setIsRegister(false);
          return;
        }

        // Session set ho gayi — turant push
        router.push("/dashboard");
        return;
      }

      // Login flow — fetchAppUser ka wait mat karo, session set hote hi push
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] w-full place-items-center px-4 py-8 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">
            {isRegister ? "Create account 🚀" : "Welcome back 👋"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Start managing your assets with Capverra."
              : "Sign in to continue to your dashboard."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full text-sm"
            disabled={loading}
            onClick={() => {
              setIsRegister((v) => !v);
              setError("");
            }}
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}