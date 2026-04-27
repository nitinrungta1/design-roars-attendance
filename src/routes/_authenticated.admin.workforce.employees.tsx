import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, X } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listDirectory, getEmployeeProfile } from "@/lib/workforce-pro.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/employees")({
  head: () =>
    seo({
      title: "Employees | Admin",
      description: "Employee directory across all companies.",
      kind: "product",
      path: "/admin/workforce/employees",
      noindex: true,
    }),
  component: EmployeesPage,
});

const STATUS_TONES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  on_leave: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  terminated: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  suspended: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
};

const TYPE_TONES: Record<string, string> = {
  full_time: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  part_time: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  contract: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  intern: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  consultant: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
};

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "directory", search],
    queryFn: () => listDirectory({ data: { search: search || undefined } }),
  });
  const rows = data?.rows ?? [];
  const totals = {
    all: rows.length,
    active: rows.filter((e) => e.status === "active").length,
    full_time: rows.filter((e) => e.employment_type === "full_time").length,
    contract: rows.filter((e) => e.employment_type === "contract").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Employee Directory"
        description="Searchable directory of every workforce member across all tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Employees" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={totals.all} />
          <StatCard label="Active" value={totals.active} tone="success" />
          <StatCard label="Full-time" value={totals.full_time} />
          <StatCard label="Contract" value={totals.contract} tone="warning" />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, or email…"
            className="pl-9"
          />
        </div>

        <DataTable
          headers={["Code", "Name", "Department", "Designation", "Type", "Manager", "Hired", "Status"]}
          empty={
            !isLoading && rows.length === 0 ? (
              <EmptyState
                icon={Users}
                title={search ? "No matches" : "No employees yet"}
                description={
                  search
                    ? "Try a different search term."
                    : "Once tenants onboard their workforce, employees will show up here."
                }
              />
            ) : null
          }
        >
          {rows.map((e) => (
            <Tr key={e.id} className="cursor-pointer" >
              <Td mono>
                <button onClick={() => setOpenId(e.id)} className="hover:underline">
                  {e.employee_code}
                </button>
              </Td>
              <Td>
                <button onClick={() => setOpenId(e.id)} className="text-left">
                  <div className="font-medium hover:underline">{e.full_name}</div>
                  <div className="text-xs text-muted-foreground">{e.email ?? "—"}</div>
                </button>
              </Td>
              <Td>{e.department_name ?? "—"}</Td>
              <Td>{e.designation_name ?? "—"}</Td>
              <Td>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", TYPE_TONES[e.employment_type])}
                >
                  {e.employment_type.replace("_", " ")}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">{e.manager_name ?? "—"}</Td>
              <Td className="text-muted-foreground">
                {e.hire_date ? fmtDate(e.hire_date) : "—"}
              </Td>
              <Td>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", STATUS_TONES[e.status] ?? "bg-muted")}
                >
                  {e.status.replace("_", " ")}
                </Badge>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>

      <ProfileDrawer
        employeeId={openId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

function ProfileDrawer({
  employeeId,
  onClose,
}: {
  employeeId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "employee", employeeId],
    queryFn: () => getEmployeeProfile({ data: { id: employeeId! } }),
    enabled: !!employeeId,
  });

  return (
    <Sheet open={!!employeeId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Employee profile</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading profile…</p>
        )}

        {data && (
          <div className="mt-6 space-y-6">
            <header className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{data.employee.full_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {data.employee.designation_name ?? "—"} · {data.employee.department_name ?? "—"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", STATUS_TONES[data.employee.status] ?? "bg-muted")}
                >
                  {data.employee.status.replace("_", " ")}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", TYPE_TONES[data.employee.employment_type])}
                >
                  {data.employee.employment_type.replace("_", " ")}
                </Badge>
              </div>
            </header>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Code" value={data.employee.employee_code} mono />
                <Field label="Email" value={data.employee.email ?? "—"} />
                <Field label="Phone" value={data.employee.phone ?? "—"} />
                <Field label="Location" value={data.employee.location_name ?? "—"} />
                <Field label="Manager" value={data.employee.manager_name ?? "—"} />
                <Field
                  label="Hired"
                  value={data.employee.hire_date ? fmtDate(data.employee.hire_date) : "—"}
                />
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attendance · last 30d
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <MiniStat label="Present" value={data.attendance_summary.present} tone="success" />
                <MiniStat label="Late" value={data.attendance_summary.late} tone="warning" />
                <MiniStat label="Absent" value={data.attendance_summary.absent} tone="danger" />
                <MiniStat label="On leave" value={data.attendance_summary.on_leave} />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timesheets · last 30d
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Hours" value={data.timesheet_summary.total_hours} />
                <MiniStat label="Approved" value={data.timesheet_summary.approved} tone="success" />
                <MiniStat label="Pending" value={data.timesheet_summary.pending} tone="warning" />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assets ({data.assets.length})
              </h3>
              {data.assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets assigned.</p>
              ) : (
                <ul className="space-y-2">
                  {data.assets.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{a.kind}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmtDate(a.assigned_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents ({data.documents.length})
              </h3>
              {data.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents on file.</p>
              ) : (
                <ul className="space-y-2">
                  {data.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{d.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {d.doc_type.replace(/_/g, " ")}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmtDate(d.uploaded_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 font-medium", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
      <div className={cn("text-lg font-bold", toneClass)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
