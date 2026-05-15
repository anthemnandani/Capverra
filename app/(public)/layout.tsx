"use client";

import type React from "react";
import { useEffect } from "react";
import { useAuth } from "@/context";
import "./globals-public.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // router.replace ki jagah hard navigation — taaki public CSS bundle
      // unload ho aur protected bundle fresh load ho (golden theme leak band)
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isLoading]);

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}