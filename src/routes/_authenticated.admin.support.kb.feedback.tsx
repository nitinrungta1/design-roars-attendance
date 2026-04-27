import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtRelative } from "@/components/admin/data-shell";
import { listKbFeedback } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb/feedback")({
  head: () => seo({ title: "KB feedback | Admin", description: "Article feedback", path: "/admin/support/kb/feedback", kind: "product", noindex: true }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { data } = useQuery({ queryKey: ["kb-feedback"], queryFn: () => listKbFeedback() });
  const rows = data?.feedback ?? [];
  return (
    <>
      <PageHeader eyebrow="KB" title="Article feedback" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base", to: "/admin/support/kb" }, { label: "Feedback" }]} />
      <PageBody>
        <DataTable headers={["", "Article slug", "Comment", "When"]}>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>{r.helpful ? <ThumbsUp className="h-4 w-4 text-success" /> : <ThumbsDown className="h-4 w-4 text-destructive" />}</Td>
              <Td mono>{r.slug}</Td>
              <Td className="max-w-md truncate">{r.comment ?? "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(r.created_at)}</Td>
            </Tr>
          ))}
        </DataTable>
      </PageBody>
    </>
  );
}
