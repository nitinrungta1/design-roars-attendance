import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listAccounts } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/accounts")({
  head: () =>
    seo({
      title: "Accounts | Admin",
      description: "All user accounts across tenants.",
      kind: "product",
      path: "/admin/customers/accounts",
      noindex: true,
    }),
  component: AccountsPage,
});

function AccountsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: () => listAccounts(),
  });

  const accounts = data?.accounts ?? [];
  const filtered = accounts.filter(
    (a) =>
      !search ||
      (a.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.company_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totals = {
    all: accounts.length,
    withCompany: accounts.filter((a) => a.company_id).length,
    admins: accounts.filter((a) =>
      a.roles.some((r) => r === "super_admin" || r === "admin"),
    ).length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Accounts"
        description="Every authenticated user across all tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Accounts" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total accounts" value={totals.all} />
          <StatCard label="In a company" value={totals.withCompany} />
          <StatCard label="Admin users" value={totals.admins} tone="success" />
        </div>

        <Input
          placeholder="Search by name or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <DataTable
          headers={["User", "Company", "Roles", "Joined"]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState icon={Users} title="No accounts yet" />
            ) : null
          }
        >
          {filtered.map((a) => {
            const initials = (a.full_name ?? "?")
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Tr key={a.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-gradient-brand text-xs text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="font-medium">{a.full_name ?? "—"}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {a.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="text-muted-foreground">{a.company_name ?? "—"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {a.roles.length === 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        none
                      </Badge>
                    )}
                    {a.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px] capitalize">
                        {r.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="text-muted-foreground">{fmtDate(a.created_at)}</Td>
              </Tr>
            );
          })}
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
