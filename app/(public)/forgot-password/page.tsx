"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "email" | "otp";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Supabase se OTP bhejo
const handleEmailSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    toast.success("OTP sent to your email.");
    setStep("otp");
  } catch (error: any) {
    toast.error(error.message || "Failed to send OTP.");
  } finally {
    setLoading(false);
  }
};

  // Step 2: OTP verify karo
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem("reset_token", data.resetToken);
      sessionStorage.setItem("reset_email", email);

      toast.success("OTP verified. Set your new password.");
      router.push("/reset-password");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20 mt-28">
        <Card className="w-full max-w-md border-border bg-card shadow-xl">
          <CardContent className="p-8">

            {step === "email" && (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Forgot Password</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your email and we'll send you a one-time code.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft size={16} />
                    Back To Login
                  </Link>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Enter OTP</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Code sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>One-Time Code</Label>
                    <Input
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      value={otp}
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft size={16} />
                    Change Email
                  </button>
                </form>
              </>
            )}

          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}