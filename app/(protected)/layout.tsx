"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/context";
import { AppShell } from "@/components/layout/app-shell";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

 useEffect(() => {
  const currentRouteTheme = localStorage.getItem("route-theme");

  if (currentRouteTheme !== "protected") {
    setTheme("light");
    localStorage.setItem("route-theme", "protected");
  }
}, [setTheme]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AppShell>{children}</AppShell>;
}