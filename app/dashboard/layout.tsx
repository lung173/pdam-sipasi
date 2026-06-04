// app/dashboard/layout.tsx
/**
 * @file app/dashboard/layout.tsx
 * @description Layout untuk halaman dashboard. Menampilkan sidebar, topbar, dan membungkus halaman-halaman dashboard lainnya.
 * @location Dirender di semua halaman yang berada di dalam "/dashboard".
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name}
      user={session.user}
    >
      {children}
    </DashboardShell>
  );
}
