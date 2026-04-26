import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarHeart, Plus, Trash2 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  listHolidays,
  createHoliday,
  deleteHoliday,
  listCompanyOptions,
} from "@/lib/workforce.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/holidays")({
  head: () =>
    seo({
      title: "Holidays | Admin",
      description: "Holiday calendar per company / region.",
      kind: "product",
      path: "/admin/workforce/holidays",
      noindex: true,
    }),
  component: HolidaysPage,
});

function HolidaysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "holidays"],
    queryFn: () => listHolidays(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "company-options"],
    queryFn: () => listCompanyOptions(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_id: "",
    name: "",
    holiday_date: "",
    region: "",
    is_optional: false,
  });

  const create = useMutation({
    mutationFn: () => createHoliday({ data: form }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Holiday added");
        setOpen(false);
        setForm({ company_id: "", name: "", holiday_date: "", region: "", is_optional: false });
        qc.invalidateQueries({ queryKey: ["admin", "holidays"] });
      } else toast.error(res.error);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHoliday({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Removed");
        qc.invalidateQueries({ queryKey: ["admin", "holidays"] });
      } else toast.error(res.error);
    },
  });

  const holidays = data?.holidays ?? [];
  const upcoming = holidays.filter((h) => new Date(h.holiday_date) >= new Date());

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Holidays"
        description="Holiday calendar across every company and region."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Holidays" }]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add holiday</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Select
                    value={form.company_id}
                    onValueChange={(v) => setForm({ ...form, company_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies?.companies ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Diwali"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.holiday_date}
                      onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Region (optional)</Label>
                    <Input
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="India"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.is_optional}
                    onCheckedChange={(v) => setForm({ ...form, is_optional: v === true })}
                  />
                  Optional / floater holiday
                </label>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.company_id || !form.name || !form.holiday_date || create.isPending}
                >
                  Add holiday
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total" value={holidays.length} />
          <StatCard label="Upcoming" value={upcoming.length} tone="success" />
          <StatCard label="Companies" value={new Set(holidays.map((h) => h.company_id)).size} />
        </div>

        <DataTable
          headers={["Date", "Name", "Company", "Region", "Type", ""]}
          empty={
            !isLoading && holidays.length === 0 ? (
              <EmptyState
                icon={CalendarHeart}
                title="No holidays yet"
                description="Add national, regional, or company-specific holidays to drive attendance and payroll."
              />
            ) : null
          }
        >
          {holidays.map((h) => (
            <Tr key={h.id}>
              <Td className="font-mono text-xs">{fmtDate(h.holiday_date)}</Td>
              <Td>
                <div className="font-medium">{h.name}</div>
              </Td>
              <Td className="text-muted-foreground">{h.company_name}</Td>
              <Td className="text-muted-foreground">{h.region ?? "—"}</Td>
              <Td>
                {h.is_optional ? (
                  <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Optional
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Mandatory
                  </Badge>
                )}
              </Td>
              <Td className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(h.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
