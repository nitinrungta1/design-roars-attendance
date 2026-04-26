import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { listEmployees } from "@/lib/workforce.functions";
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
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: () => listEmployees(),
  });
  const employees = data?.employees ?? [];
  const totals = {
    all: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    full_time: employees.filter((e) => e.employment_type === "full_time").length,
    contract: employees.filter((e) => e.employment_type === "contract").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Employees"
        description="Directory of every workforce member across all tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Employees" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={totals.all} />
          <StatCard label="Active" value={totals.active} tone="success" />
          <StatCard label="Full-time" value={totals.full_time} />
          <StatCard label="Contract" value={totals.contract} tone="warning" />
        </div>

        <DataTable
          headers={["Code", "Name", "Department", "Designation", "Type", "Company", "Hired", "Status"]}
          empty={
            !isLoading && employees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees yet"
                description="Once tenants onboard their workforce, employees will show up here."
              />
            ) : null
          }
        >
          {employees.map((e) => (
            <Tr key={e.id}>
              <Td mono>{e.employee_code}</Td>
              <Td>
                <div className="font-medium">{e.full_name}</div>
                <div className="text-xs text-muted-foreground">{e.email ?? "—"}</div>
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
              <Td className="text-muted-foreground">{e.company_name}</Td>
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
    </>
  );
}
