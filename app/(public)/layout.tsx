"use client";

import type React from "react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context";
import { usePathname, useRouter } from "next/navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

useEffect(() => {
  const routeTheme = localStorage.getItem("route-theme");

  if (routeTheme !== "public") {
    localStorage.setItem("route-theme", "public");

    const manual = localStorage.getItem("user-manual-theme");

    if (!manual) {
      setTheme("dark");
    }
  }
}, []);

  const authExemptRoutes = [
    "/forgot-password",
    "/reset-password",
    "/callback",
    "/auth/callback",
  ];

  const shouldSkipRedirect = authExemptRoutes.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (isLoading) return;
    if (shouldSkipRedirect) return;
    if (!isAuthenticated) return;
    if (pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, shouldSkipRedirect, pathname, router]);

  // Exempt pages hamesha render karo bina redirect ke
  if (shouldSkipRedirect) {
    return <>{children}</>;
  }

  return <>{children}</>;
}