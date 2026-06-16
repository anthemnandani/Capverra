"use client";

import type React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <AuthProvider>
        {children}
        <Toaster richColors={false} />
      </AuthProvider>
    </ThemeProvider>
  );
}
