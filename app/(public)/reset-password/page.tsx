"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            console.log("RESET PAGE EVENT:", event);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        console.log("RESET PAGE MOUNTED");
    }, []);

    const handleUpdatePassword = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const supabase =
                createSupabaseBrowserClient();

            const { error } =
                await supabase.auth.updateUser({
                    password,
                });

            if (error) throw error;

            // Recovery session ko remove karo
            await supabase.auth.signOut();

            toast.success(
                "Password updated successfully. Please sign in with your new password."
            );

            router.replace("/login");
        } catch (error: any) {
            toast.error(
                error.message ||
                "Failed to update password."
            );
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

                        <h1 className="text-2xl font-bold">
                            Reset Password
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Create a new password for your account.
                        </p>
                    </div>

                    <form
                        onSubmit={handleUpdatePassword}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <Label>New Password</Label>

                            <Input
                                type="password"
                                minLength={6}
                                required
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Confirm Password</Label>

                            <Input
                                type="password"
                                minLength={6}
                                required
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <Button
                            className="w-full"
                            disabled={loading}
                        >
                            {loading
                                ? "Updating..."
                                : "Update Password"}
                        </Button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}