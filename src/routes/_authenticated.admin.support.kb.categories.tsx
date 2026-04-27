import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { DataTable, Td, Tr } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { listKbCategories, upsertKbCategory, deleteKbCategory } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb/categories")({
  head: () => seo({ title: "KB categories | Admin", description: "Manage KB categories", path: "/admin/support/kb/categories", kind: "product", noindex: true }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data, refetch } = useQuery({ queryKey: ["kb-cats"], queryFn: () => listKbCategories() });
  const upsert = useServerFn(upsertKbCategory);
  const del = useServerFn(deleteKbCategory);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await upsert({ data: { name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } });
    if (res.ok) { toast.success("Added"); setName(""); setSlug(""); refetch(); }
    else toast.error(res.error);
  };

  return (
    <>
      <PageHeader eyebrow="KB" title="Categories" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base", to: "/admin/support/kb" }, { label: "Categories" }]} />
      <PageBody className="space-y-6">
        <form onSubmit={onAdd} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex-1 min-w-[200px]"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></div>
          <div className="flex-1 min-w-[200px]"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={80} placeholder="auto" /></div>
          <Button type="submit" className="bg-gradient-brand">Add category</Button>
        </form>
        <DataTable headers={["Name", "Slug", "Description", ""]}>
          {(data?.categories ?? []).map((c) => (
            <Tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td mono>{c.slug}</Td>
              <Td className="text-muted-foreground">{c.description ?? "—"}</Td>
              <Td><Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: c.id } }); refetch(); } }}>Delete</Button></Td>
            </Tr>
          ))}
        </DataTable>
      </PageBody>
    </>
  );
}
