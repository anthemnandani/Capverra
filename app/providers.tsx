"use client";

import type React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors={false}  />
    </AuthProvider>
  );
}