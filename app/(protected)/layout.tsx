"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import { AppShell } from "@/components/layout/app-shell";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // isLoading khatam hone ke baad hi check karo
    // warna first render pe always redirect hoga
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Auth check chal raha hai — spinner dikhao
  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Unauthenticated — redirect ho raha hai, kuch mat dikhao
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — AppShell ke saath content dikhao
  return <>{children}</>;
}