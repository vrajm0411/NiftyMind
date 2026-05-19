import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.upstoxTokenValid) {
    redirect("/access-token");
  }

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar userName={session.user.name} userEmail={session.user.email} />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>
    </Providers>
  );
}
