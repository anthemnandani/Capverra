"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import "./globals-public.css";


export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Authenticated hai — redirect ho raha hai, kuch mat dikhao
  if (!isLoading && isAuthenticated) {
    return null;
  }

  return <div className="public-theme">{children}</div>;
}