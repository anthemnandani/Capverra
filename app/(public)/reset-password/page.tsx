"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("reset_token");
    if (!token) {
      toast.error("Invalid or expired reset session.");
      router.replace("/forgot-password");
      return;
    }
    setResetToken(token);
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_email");

      toast.success("Password updated successfully. Please sign in.");
      router.replace("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
          <div className="mb-8 text-center">
            <Lock className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a new password for your account.
            </p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                minLength={6}
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                minLength={6}
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={loading || !resetToken}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}