import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock4 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { listShifts } from "@/lib/workforce.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/shifts")({
  head: () =>
    seo({
      title: "Shifts | Admin",
      description: "Shift templates, rotations, assignments.",
      kind: "product",
      path: "/admin/workforce/shifts",
      noindex: true,
    }),
  component: ShiftsPage,
});

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function ShiftsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "shifts"],
    queryFn: () => listShifts(),
  });
  const shifts = data?.shifts ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Shifts"
        description="Shift templates, weekly offs, and night-shift configuration per tenant."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Shifts" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Templates" value={shifts.length} />
          <StatCard
            label="Night shifts"
            value={shifts.filter((s) => s.is_night_shift).length}
            tone="warning"
          />
          <StatCard
            label="Companies covered"
            value={new Set(shifts.map((s) => s.company_id)).size}
          />
        </div>

        <DataTable
          headers={["Name", "Company", "Window", "Break", "Weekly off", "Night", "Color"]}
          empty={
            !isLoading && shifts.length === 0 ? (
              <EmptyState
                icon={Clock4}
                title="No shifts yet"
                description="HR teams create shift templates that drive attendance, late thresholds, and OT calculations."
              />
            ) : null
          }
        >
          {shifts.map((s) => (
            <Tr key={s.id}>
              <Td>
                <div className="font-medium">{s.name}</div>
              </Td>
              <Td className="text-muted-foreground">{s.company_name}</Td>
              <Td className="font-mono text-xs">
                {fmtTime(s.start_time)} → {fmtTime(s.end_time)}
              </Td>
              <Td>{s.break_minutes} min</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {s.weekly_off.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    s.weekly_off.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px]">
                        {DAY_LABELS[d] ?? d}
                      </Badge>
                    ))
                  )}
                </div>
              </Td>
              <Td>
                {s.is_night_shift ? (
                  <Badge variant="secondary" className="rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Night
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Day</span>
                )}
              </Td>
              <Td>
                <span
                  className="inline-block h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: s.color }}
                />
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
