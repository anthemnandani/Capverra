import type React from "react";
import "./globals-public.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-theme">{children}</div>;
}