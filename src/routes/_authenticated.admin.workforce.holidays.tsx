import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarHeart,
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  Sparkles,
  CalendarDays,
  Globe2,
  Settings as SettingsIcon,
} from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  HOLIDAY_TYPES,
  type HolidayType,
  type CompanyHolidayRow,
  type HolidayTemplateRow,
  listCountries,
  listHolidayTemplates,
  listCompanyHolidays,
  createHolidayV2,
  updateHolidayV2,
  deleteHolidayV2,
  importHolidayTemplate,
  duplicateHolidayToYears,
  bulkImportHolidays,
  getCompanyHolidaySettings,
  updateCompanyHolidaySettings,
  getLongWeekends,
} from "@/lib/holidays.functions";
import { listCompanyOptions } from "@/lib/workforce.functions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/holidays")({
  head: () =>
    seo({
      title: "Holidays | Admin",
      description: "Country-aware holiday calendars per company.",
      kind: "product",
      path: "/admin/workforce/holidays",
      noindex: true,
    }),
  component: HolidaysPage,
});

const YEARS = [2024, 2025, 2026, 2027, 2028];
const TYPE_TONE: Record<HolidayType, string> = {
  national: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  regional: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  religious: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  optional: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  company: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  half_day: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
};
const WEEKDAYS = [
  { v: 0, label: "Sun" },
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

function HolidaysPage() {
  const blocked = useRequirePermission("workforce.holidays.read");
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [tab, setTab] = useState("list");
  const [editing, setEditing] = useState<CompanyHolidayRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["admin", "company-options"],
    queryFn: () => listCompanyOptions(),
  });
  const { data: countries } = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: () => listCountries(),
  });
  const { data: holidaysData, isLoading } = useQuery({
    queryKey: ["admin", "holidays", companyId, year],
    queryFn: () =>
      listCompanyHolidays({
        data: { company_id: companyId || undefined, year },
      }),
  });
  const { data: settingsData } = useQuery({
    queryKey: ["admin", "holiday-settings", companyId],
    queryFn: () =>
      companyId
        ? getCompanyHolidaySettings({ data: { company_id: companyId } })
        : Promise.resolve({ settings: null }),
    enabled: !!companyId,
  });
  const { data: longWeekends } = useQuery({
    queryKey: ["admin", "long-weekends", companyId, year],
    queryFn: () =>
      companyId
        ? getLongWeekends({ data: { company_id: companyId, year } })
        : Promise.resolve({ weekends: [] }),
    enabled: !!companyId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHolidayV2({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Holiday removed");
        qc.invalidateQueries({ queryKey: ["admin", "holidays"] });
      } else toast.error(res.error);
    },
  });

  const holidays = holidaysData?.holidays ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.holiday_date >= today);
  const paidCount = holidays.filter((h) => h.is_paid).length;

  if (blocked) return blocked;

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Holiday Management"
        description="Country-aware holiday calendars, custom company holidays, and weekend rules."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Holidays" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => exportCsv(holidays, year)}
              disabled={holidays.length === 0}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setCsvOpen(true)}
              disabled={!companyId}
            >
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              disabled={!companyId}
            >
              <Plus className="h-4 w-4" /> Add holiday
            </Button>
          </div>
        }
      />
      <PageBody className="space-y-6">
        {/* Filter bar */}
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card/40 p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Company
            </Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Year
            </Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Country (templates)
            </Label>
            <Select
              value={settingsData?.settings?.country_code ?? ""}
              onValueChange={(v) => {
                if (companyId) {
                  updateCompanyHolidaySettings({
                    data: { company_id: companyId, country_code: v },
                  }).then(() => {
                    qc.invalidateQueries({ queryKey: ["admin", "holiday-settings"] });
                    setTab("templates");
                    toast.message("Country set — open Templates to import.");
                  });
                }
              }}
              disabled={!companyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a country" />
              </SelectTrigger>
              <SelectContent>
                {(countries?.countries ?? []).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag_emoji ?? "🌐"} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={holidays.length} />
          <StatCard label="Upcoming" value={upcoming.length} tone="success" />
          <StatCard label="Paid" value={paidCount} />
          <StatCard
            label="Long weekends"
            value={longWeekends?.weekends.length ?? 0}
            tone="success"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <CalendarHeart className="h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Globe2 className="h-4 w-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="long-weekends" className="gap-2">
              <Sparkles className="h-4 w-4" /> Long weekends
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <SettingsIcon className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* LIST */}
          <TabsContent value="list" className="mt-4">
            <DataTable
              headers={["Date", "Name", "Country", "Type", "Paid", "Recurring", ""]}
              empty={
                !isLoading && holidays.length === 0 ? (
                  <EmptyState
                    icon={CalendarHeart}
                    title="No holidays yet"
                    description={
                      companyId
                        ? "Pick a country and import the prebuilt template, or add a custom holiday."
                        : "Select a company to view its holidays."
                    }
                  />
                ) : null
              }
            >
              {holidays.map((h) => (
                <Tr key={h.id}>
                  <Td className="font-mono text-xs">{fmtDate(h.holiday_date)}</Td>
                  <Td>
                    <div className="font-medium">{h.name}</div>
                    {h.region && (
                      <div className="text-xs text-muted-foreground">{h.region}</div>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">
                    {h.country_code
                      ? `${countries?.countries.find((c) => c.code === h.country_code)?.flag_emoji ?? ""} ${h.country_code}`
                      : "—"}
                  </Td>
                  <Td>
                    <Badge
                      variant="secondary"
                      className={`rounded-full ${TYPE_TONE[h.type]}`}
                    >
                      {h.type.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td>{h.is_paid ? "Yes" : "No"}</Td>
                  <Td>{h.is_recurring ? "Yes" : "No"}</Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(h);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remove "${h.name}"?`)) remove.mutate(h.id);
                      }}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              )}
            </DataTable>
          </TabsContent>

          {/* CALENDAR */}
          <TabsContent value="calendar" className="mt-4">
            <YearCalendar holidays={holidays} year={year} />
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="mt-4">
            <TemplatesPanel
              companyId={companyId}
              countryCode={settingsData?.settings?.country_code ?? ""}
              year={year}
              countries={countries?.countries ?? []}
              onChangeCountry={(code) => {
                if (companyId)
                  updateCompanyHolidaySettings({
                    data: { company_id: companyId, country_code: code },
                  }).then(() =>
                    qc.invalidateQueries({ queryKey: ["admin", "holiday-settings"] }),
                  );
              }}
              onImported={() =>
                qc.invalidateQueries({ queryKey: ["admin", "holidays"] })
              }
            />
          </TabsContent>

          {/* LONG WEEKENDS */}
          <TabsContent value="long-weekends" className="mt-4">
            {(longWeekends?.weekends ?? []).length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No long weekends detected"
                description="Add holidays adjacent to weekends to surface long-weekend windows."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(longWeekends?.weekends ?? []).map((w, i) => (
                  <div
                    key={`${w.start}-${i}`}
                    className="rounded-2xl border border-border bg-card/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {w.days}-day break
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {fmtDate(w.start)} – {fmtDate(w.end)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {w.names.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-4">
            <SettingsPanel
              companyId={companyId}
              countries={countries?.countries ?? []}
              settings={settingsData?.settings ?? null}
              onSaved={() =>
                qc.invalidateQueries({ queryKey: ["admin", "holiday-settings"] })
              }
            />
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Holiday form dialog */}
      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        defaultCompanyId={companyId}
        defaultCountry={settingsData?.settings?.country_code ?? ""}
        countries={countries?.countries ?? []}
        companies={companies?.companies ?? []}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin", "holidays"] });
          setEditing(null);
        }}
      />

      {/* CSV import */}
      <CsvImportDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        companyId={companyId}
        onImported={() => qc.invalidateQueries({ queryKey: ["admin", "holidays"] })}
      />

      {/* Mark importOpen unused prevention */}
      <input type="hidden" value={String(importOpen)} readOnly />
    </>
  );
}

// ============================================================
// Holiday form dialog (create + edit)
// ============================================================

function HolidayFormDialog({
  open,
  onOpenChange,
  editing,
  defaultCompanyId,
  defaultCountry,
  countries,
  companies,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  editing: CompanyHolidayRow | null;
  defaultCompanyId: string;
  defaultCountry: string;
  countries: { code: string; name: string; flag_emoji: string | null }[];
  companies: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company_id: editing?.company_id ?? defaultCompanyId,
    name: editing?.name ?? "",
    holiday_date: editing?.holiday_date ?? "",
    region: editing?.region ?? "",
    country_code: editing?.country_code ?? defaultCountry,
    type: (editing?.type ?? "company") as HolidayType,
    is_paid: editing?.is_paid ?? true,
    is_recurring: editing?.is_recurring ?? false,
    is_optional: editing?.is_optional ?? false,
    description: editing?.description ?? "",
  });
  // reset when editing changes
  useMemo(() => {
    setForm({
      company_id: editing?.company_id ?? defaultCompanyId,
      name: editing?.name ?? "",
      holiday_date: editing?.holiday_date ?? "",
      region: editing?.region ?? "",
      country_code: editing?.country_code ?? defaultCountry,
      type: (editing?.type ?? "company") as HolidayType,
      is_paid: editing?.is_paid ?? true,
      is_recurring: editing?.is_recurring ?? false,
      is_optional: editing?.is_optional ?? false,
      description: editing?.description ?? "",
    });
  }, [editing, defaultCompanyId, defaultCountry]);

  const save = useMutation({
    mutationFn: async () => {
      if (editing)
        return updateHolidayV2({ data: { id: editing.id, ...form } });
      return createHolidayV2({ data: form });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(editing ? "Holiday updated" : "Holiday added");
        onOpenChange(false);
        onSaved();
      } else toast.error(res.error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit holiday" : "Add holiday"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Company</Label>
              <Select
                value={form.company_id}
                onValueChange={(v) => setForm({ ...form, company_id: v })}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Diwali"
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.holiday_date}
                onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as HolidayType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Select
                value={form.country_code}
                onValueChange={(v) => setForm({ ...form, country_code: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag_emoji ?? "🌐"} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Region (optional)</Label>
              <Input
                value={form.region ?? ""}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_paid}
                onCheckedChange={(v) => setForm({ ...form, is_paid: v === true })}
              />
              Paid
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_recurring}
                onCheckedChange={(v) => setForm({ ...form, is_recurring: v === true })}
              />
              Recurring yearly
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_optional}
                onCheckedChange={(v) => setForm({ ...form, is_optional: v === true })}
              />
              Optional / floater
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={
              !form.company_id || !form.name || !form.holiday_date || save.isPending
            }
          >
            {editing ? "Save changes" : "Add holiday"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Templates panel (preview + import)
// ============================================================

function TemplatesPanel({
  companyId,
  countryCode,
  year,
  countries,
  onChangeCountry,
  onImported,
}: {
  companyId: string;
  countryCode: string;
  year: number;
  countries: { code: string; name: string; flag_emoji: string | null }[];
  onChangeCountry: (code: string) => void;
  onImported: () => void;
}) {
  const [mode, setMode] = useState<"merge" | "replace" | "skip_duplicates">("merge");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "holiday-templates", countryCode, year],
    queryFn: () =>
      countryCode
        ? listHolidayTemplates({ data: { country_code: countryCode, year } })
        : Promise.resolve({ templates: [] }),
    enabled: !!countryCode,
  });
  const importer = useMutation({
    mutationFn: () =>
      importHolidayTemplate({
        data: { company_id: companyId, country_code: countryCode, year, mode },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Imported ${res.inserted ?? 0} holidays`);
        onImported();
      } else toast.error(res.error);
    },
  });
  const templates = data?.templates ?? [];

  if (!companyId)
    return (
      <EmptyState
        icon={Globe2}
        title="Select a company first"
        description="Templates apply to a specific company."
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/40 p-4">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Country
          </Label>
          <Select value={countryCode} onValueChange={onChangeCountry}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Pick a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag_emoji ?? "🌐"} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Import mode
          </Label>
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as "merge" | "replace" | "skip_duplicates")}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merge">Merge — add missing holidays</SelectItem>
              <SelectItem value="replace">Replace — clear year first</SelectItem>
              <SelectItem value="skip_duplicates">Skip duplicates</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => importer.mutate()}
          disabled={!countryCode || templates.length === 0 || importer.isPending}
        >
          Import {templates.length} into company
        </Button>
      </div>

      <DataTable
        headers={["Date", "Name", "Type", "Region"]}
        empty={
          !isLoading && templates.length === 0 ? (
            <EmptyState
              icon={Globe2}
              title="No prebuilt template"
              description="Pick a country to see its prebuilt holidays for this year."
            />
          ) : null
        }
      >
        {templates.map((t: HolidayTemplateRow) => (
          <Tr key={t.id}>
            <Td className="font-mono text-xs">{fmtDate(t.holiday_date)}</Td>
            <Td className="font-medium">{t.name}</Td>
            <Td>
              <Badge
                variant="secondary"
                className={`rounded-full ${TYPE_TONE[t.type]}`}
              >
                {t.type.replace("_", " ")}
              </Badge>
            </Td>
            <Td className="text-muted-foreground">{t.region ?? "—"}</Td>
          </Tr>
        ))}
      </DataTable>
    </div>
  );
}

// ============================================================
// Settings panel
// ============================================================

function SettingsPanel({
  companyId,
  countries,
  settings,
  onSaved,
}: {
  companyId: string;
  countries: { code: string; name: string; flag_emoji: string | null }[];
  settings: { country_code: string | null; weekend_days: number[]; auto_import_enabled: boolean } | null;
  onSaved: () => void;
}) {
  const [country, setCountry] = useState(settings?.country_code ?? "");
  const [weekend, setWeekend] = useState<number[]>(settings?.weekend_days ?? [0, 6]);
  const [autoImport, setAutoImport] = useState(settings?.auto_import_enabled ?? false);

  useMemo(() => {
    setCountry(settings?.country_code ?? "");
    setWeekend(settings?.weekend_days ?? [0, 6]);
    setAutoImport(settings?.auto_import_enabled ?? false);
  }, [settings]);

  const save = useMutation({
    mutationFn: () =>
      updateCompanyHolidaySettings({
        data: {
          company_id: companyId,
          country_code: country,
          weekend_days: weekend,
          auto_import_enabled: autoImport,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Settings saved");
        onSaved();
      } else toast.error(res.error);
    },
  });

  if (!companyId)
    return (
      <EmptyState
        icon={SettingsIcon}
        title="Select a company"
        description="Each company has its own holiday settings."
      />
    );

  const toggleDay = (d: number) =>
    setWeekend((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold">Default country</h3>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag_emoji ?? "🌐"} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used as the default when importing prebuilt holiday templates.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold">Weekend days</h3>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => toggleDay(d.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                weekend.includes(d.v)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Button size="sm" variant="ghost" onClick={() => setWeekend([0, 6])}>
            Sat–Sun
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setWeekend([5, 6])}>
            Fri–Sat
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setWeekend([5])}>
            Friday only
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Auto-import next year</h3>
            <p className="text-xs text-muted-foreground">
              When enabled, the platform will pull the next year's prebuilt holidays
              automatically.
            </p>
          </div>
          <Switch checked={autoImport} onCheckedChange={setAutoImport} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CSV import dialog
// ============================================================

function CsvImportDialog({
  open,
  onOpenChange,
  companyId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  companyId: string;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const importer = useMutation({
    mutationFn: () => {
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("No valid rows found");
      return bulkImportHolidays({ data: { company_id: companyId, rows } });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Imported ${res.inserted} holidays`);
        onOpenChange(false);
        setText("");
        onImported();
      } else toast.error(res.error);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import holidays from CSV</DialogTitle>
          <DialogDescription>
            Paste CSV with header:{" "}
            <code>name,holiday_date,type,region,is_paid</code>
            <br />
            <code>type</code> = national | regional | religious | optional | company |
            half_day
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`name,holiday_date,type,region,is_paid\nFoundation Day,2025-06-01,company,,true`}
          className="font-mono text-xs"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => importer.mutate()}
            disabled={!text.trim() || importer.isPending}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const out: {
    name: string;
    holiday_date: string;
    type: HolidayType;
    region: string;
    is_paid: boolean;
  }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    if (cells.length < 2) continue;
    const name = cells[idx("name")] ?? "";
    const date = cells[idx("holiday_date")] ?? "";
    if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const typeRaw = (cells[idx("type")] ?? "company").toLowerCase();
    const type = (HOLIDAY_TYPES as readonly string[]).includes(typeRaw)
      ? (typeRaw as HolidayType)
      : "company";
    out.push({
      name,
      holiday_date: date,
      type,
      region: cells[idx("region")] ?? "",
      is_paid: (cells[idx("is_paid")] ?? "true").toLowerCase() !== "false",
    });
  }
  return out;
}

function exportCsv(rows: CompanyHolidayRow[], year: number) {
  const header = "date,name,country,type,paid,recurring,region";
  const body = rows
    .map((r) =>
      [
        r.holiday_date,
        `"${r.name.replace(/"/g, '""')}"`,
        r.country_code ?? "",
        r.type,
        r.is_paid ? "true" : "false",
        r.is_recurring ? "true" : "false",
        r.region ?? "",
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `holidays-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Year calendar (simple month grid x12)
// ============================================================

function YearCalendar({
  holidays,
  year,
}: {
  holidays: CompanyHolidayRow[];
  year: number;
}) {
  const byDate = new Map<string, CompanyHolidayRow>();
  holidays.forEach((h) => byDate.set(h.holiday_date, h));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs">
        <Legend tone={TYPE_TONE.national} label="National" />
        <Legend tone={TYPE_TONE.religious} label="Religious" />
        <Legend tone={TYPE_TONE.regional} label="Regional" />
        <Legend tone={TYPE_TONE.optional} label="Optional" />
        <Legend tone={TYPE_TONE.company} label="Company" />
        <Legend tone={TYPE_TONE.half_day} label="Half-day" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, m) => (
          <MonthGrid key={m} year={year} month={m} byDate={byDate} />
        ))}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function MonthGrid({
  year,
  month,
  byDate,
}: {
  year: number;
  month: number;
  byDate: Map<string, CompanyHolidayRow>;
}) {
  const monthName = new Date(year, month, 1).toLocaleString("en", { month: "long" });
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <h4 className="mb-3 text-sm font-semibold">
        {monthName} <span className="text-muted-foreground">{year}</span>
      </h4>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const h = byDate.get(iso);
          return (
            <div
              key={i}
              title={h?.name ?? ""}
              className={`aspect-square rounded-md text-xs flex items-center justify-center ${
                h ? TYPE_TONE[h.type] : "text-foreground/70"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
