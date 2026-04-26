import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/careers")({
  head: () => seo({ title: "Careers | Admin", description: "Job postings management.", kind: "product", path: "/admin/cms/careers", noindex: true }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <>
      <PageHeader eyebrow="Content" title="Careers" description="Job postings published on /careers." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Careers" }]} />
      <PageBody>
        <EmptyState icon={Briefcase} title="Add your first job opening" description="Drafts, departments, locations, and the public careers page CMS arrive next iteration." />
      </PageBody>
    </>
  );
}
