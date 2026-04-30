import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Users, Settings as SettingsIcon, Clock, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, type AppRole } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () =>
    seo({
      title: "Home",
      description: "Your Oqlio app launcher.",
      kind: "product",
      path: "/home",
      noindex: true,
    }),
  component: HomePage,
});

type LauncherApp = {
  key: string;
  name: string;
  description: string;
  href: string;
  icon: typeof Clock;
  iconBg: string;
  iconColor: string;
  roles: AppRole[];
};

const APPS: LauncherApp[] = [
  {
    key: "punchly",
    name: "Punchly",
    description: "HR & attendance",
    href: "/punchly",
    icon: Clock,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    roles: ["super_admin", "admin", "manager", "employee", "hr"],
  },
  {
    key: "users",
    name: "Users",
    description: "Team & access control",
    href: "/admin/users",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    roles: ["super_admin", "admin"],
  },
  {
    key: "settings",
    name: "Settings",
    description: "Platform configuration",
    href: "/admin/settings",
    icon: SettingsIcon,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
    roles: ["super_admin"],
  },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { user, profile, roles, hasAnyRole, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName = profile?.full_name ?? user?.email?.split("@")[0] ?? "there";
  const firstName = fullName.split(" ")[0];
  const primaryRole = roles[0] ?? null;
  const initials =
    fullName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const visibleApps = APPS.filter((app) => hasAnyRole(app.roles));

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/home" aria-label="Oqlio home">
            <Logo />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-transparent p-1 pr-3 transition-colors hover:border-border hover:bg-muted">
              <Avatar className="h-8 w-8">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={fullName} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium leading-tight">{fullName}</div>
                <div className="text-xs text-muted-foreground leading-tight">{user?.email}</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{fullName}</div>
                <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting()}, {firstName}
            </h1>
            {primaryRole && (
              <Badge variant="secondary" className="capitalize">
                {primaryRole.replace("_", " ")}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to your Oqlio workspace.
          </p>
        </div>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your apps
          </h2>
          {visibleApps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              You don't have access to any apps yet. Contact your administrator.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleApps.map((app) => {
                const Icon = app.icon;
                return (
                  <Link
                    key={app.key}
                    to={app.href}
                    className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg",
                        app.iconBg,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", app.iconColor)} />
                    </div>
                    <div>
                      <div className="font-medium">{app.name}</div>
                      <div className="text-xs text-muted-foreground">{app.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
