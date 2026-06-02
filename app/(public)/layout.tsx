"use client";

import type React from "react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const currentRouteTheme = localStorage.getItem("route-theme");

    if (currentRouteTheme !== "public") {
      setTheme("dark");
      localStorage.setItem("route-theme", "public");
    }
  }, [setTheme]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isLoading]);

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}