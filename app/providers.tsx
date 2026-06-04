/**
 * @file app/providers.tsx
 * @description Komponen pembungkus (wrapper) untuk menyediakan konteks global ke seluruh aplikasi, seperti SessionProvider (untuk autentikasi NextAuth) dan ThemeProvider.
 * @location Dipanggil dan dirender di dalam `app/layout.tsx`.
 */
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
