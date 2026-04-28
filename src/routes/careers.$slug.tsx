import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { seo } from "@/lib/seo";
import { getPublicJob, submitJobApplication, type JobDetail, JOB_TYPES } from "@/lib/cms.functions";

const TYPE_LABEL: Record<(typeof JOB_TYPES)[number], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const Route = createFileRoute("/careers/$slug")({
  loader: async ({ params }): Promise<{ job: JobDetail }> => {
    const { job } = await getPublicJob({ data: { slug: params.slug } });
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job) {
      return seo({
        title: "Role not found",
        description: "This role isn’t open right now.",
        path: "/careers",
        kind: "company",
        noindex: true,
      });
    }
    const desc =
      job.summary ??
      `${job.title}${job.location ? ` · ${job.location}` : ""} — ${TYPE_LABEL[job.employment_type] ?? job.employment_type}.`;
    return seo({
      title: job.title,
      description: desc,
      path: `/careers/${job.slug}`,
      kind: "company",
    });
  },
  notFoundComponent: () => (
    <MarketingLayout>
      <Section>
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-bold">Role not found</h1>
          <p className="mt-3 text-muted-foreground">
            This position isn’t open right now.
          </p>
          <Link to="/careers" className="mt-6 inline-block text-sm font-medium text-primary">
            ← All open roles
          </Link>
        </Container>
      </Section>
    </MarketingLayout>
  ),
  component: JobPage,
});

function JobPage() {
  const { job } = Route.useLoaderData() as { job: JobDetail };
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const payload = {
        job_id: job.id,
        job_slug: job.slug,
        job_title: job.title,
        full_name: String(fd.get("full_name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        linkedin: String(fd.get("linkedin") || ""),
        cover_letter: String(fd.get("cover_letter") || ""),
      };
      await submitJobApplication({ data: payload });
      setSubmitted(true);
      toast.success("Application received — we’ll be in touch soon.");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const salary =
    job.salary_min || job.salary_max
      ? `${job.salary_currency ?? ""} ${job.salary_min ?? ""}${job.salary_max ? `–${job.salary_max}` : ""}`.trim()
      : null;

  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-8 pt-12 sm:pt-16 lg:pt-20">
        <Container size="narrow" className="text-center">
          {job.department && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {job.department}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {job.location && (
              <Badge variant="outline" className="text-xs">
                {job.location}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {TYPE_LABEL[job.employment_type] ?? job.employment_type}
            </Badge>
            {salary && (
              <Badge variant="outline" className="text-xs">
                {salary}
              </Badge>
            )}
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow" className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            {job.summary && (
              <p className="text-lg text-muted-foreground">{job.summary}</p>
            )}
            <div
              className="prose prose-neutral mt-6 max-w-none dark:prose-invert prose-headings:tracking-tight"
              dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
            />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <h2 className="text-lg font-semibold">Apply for this role</h2>
              {submitted ? (
                <p className="mt-4 rounded-md bg-primary/5 p-4 text-sm text-primary">
                  Thanks! Your application is in. We’ll reply by email.
                </p>
              ) : job.apply_url ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Applications for this role are handled on our partner platform.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                      Apply now →
                    </a>
                  </Button>
                </>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                  <div>
                    <Label htmlFor="full_name" className="text-xs">
                      Full name
                    </Label>
                    <Input id="full_name" name="full_name" required maxLength={200} />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">
                      Email
                    </Label>
                    <Input id="email" name="email" type="email" required maxLength={320} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs">
                      Phone (optional)
                    </Label>
                    <Input id="phone" name="phone" maxLength={40} />
                  </div>
                  <div>
                    <Label htmlFor="linkedin" className="text-xs">
                      LinkedIn / portfolio
                    </Label>
                    <Input id="linkedin" name="linkedin" maxLength={500} placeholder="https://" />
                  </div>
                  <div>
                    <Label htmlFor="cover_letter" className="text-xs">
                      Why this role?
                    </Label>
                    <Textarea
                      id="cover_letter"
                      name="cover_letter"
                      rows={4}
                      maxLength={4000}
                      placeholder="A short note about your interest and relevant experience."
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Sending..." : "Submit application"}
                  </Button>
                </form>
              )}
            </div>
          </aside>
        </Container>
      </Section>

      <CtaBanner />
    </MarketingLayout>
  );
}
