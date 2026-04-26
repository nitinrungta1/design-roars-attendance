import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { listMedia } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/media")({
  head: () => seo({ title: "Media library | Admin", description: "Uploaded images & assets.", kind: "product", path: "/admin/cms/media", noindex: true }),
  component: MediaPage,
});

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function MediaPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "media"], queryFn: () => listMedia() });
  const media = data?.media ?? [];
  const totalBytes = media.reduce((s, m) => s + Number(m.size_bytes ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Content" title="Media Library" description="Images and assets used across blogs, pages, and emails." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Media" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Files" value={media.length} />
          <StatCard label="Storage" value={fmtBytes(totalBytes)} />
          <StatCard label="Image files" value={media.filter((m) => m.mime_type?.startsWith("image/")).length} />
        </div>
        <DataTable
          headers={["File", "Type", "Size", "Alt", "Uploaded"]}
          empty={!isLoading && media.length === 0 ? <EmptyState icon={Image} title="No media yet" description="Upload images to use across your site & emails." /> : null}
        >
          {media.map((m) => (
            <Tr key={m.id}>
              <Td className="font-medium">{m.file_name}</Td>
              <Td mono>{m.mime_type ?? "—"}</Td>
              <Td>{fmtBytes(Number(m.size_bytes ?? 0))}</Td>
              <Td className="text-muted-foreground">{m.alt_text ?? "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(m.created_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
