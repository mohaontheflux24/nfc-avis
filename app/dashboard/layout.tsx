import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getCurrentSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const configuredAdmin = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = user.role === "ADMIN" || user.email.toLowerCase() === configuredAdmin;

  return (
    <div className="flex min-h-screen bg-porcelain">
      <aside className="flex w-60 flex-col justify-between border-r border-ink/10 bg-white px-5 py-6">
        <div>
          <Link href="/" className="font-display text-lg font-semibold">
            NFC Avis
          </Link>
          <p className="mt-2 text-xs text-mist">
            {isAdmin ? "Espace administrateur" : user.name || "Espace commerçant"}
          </p>
          <nav className="mt-10 flex flex-col gap-1">
            <NavLink href="/dashboard">Tableau de bord</NavLink>
            {isAdmin && (
              <>
                <NavLink href="/dashboard/businesses">Commerçants</NavLink>
                <NavLink href="/dashboard/cards">Cartes NFC</NavLink>
              </>
            )}
          </nav>
        </div>
        <LogoutButton />
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-porcelain hover:text-ink"
    >
      {children}
    </Link>
  );
}
