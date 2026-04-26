import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Github, Linkedin, Twitter } from "lucide-react";

const cols: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features" },
      { to: "/pricing", label: "Pricing" },
      { to: "/mobile-app", label: "Mobile App" },
      { to: "/industries", label: "Industries" },
      { to: "/demo", label: "Book a Demo" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { to: "/attendance-management-system", label: "Attendance Management" },
      { to: "/time-tracking-software", label: "Time Tracking" },
      { to: "/employee-timesheet-software", label: "Employee Timesheets" },
      { to: "/gps-attendance-app", label: "GPS Attendance" },
      { to: "/biometric-attendance-software", label: "Biometric" },
      { to: "/shift-management-software", label: "Shift Management" },
      { to: "/overtime-management-system", label: "Overtime" },
      { to: "/employee-check-in-app", label: "Check-In App" },
      { to: "/payroll-attendance-integration", label: "Payroll Integration" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/blog", label: "Blog" },
      { to: "/careers", label: "Careers" },
      { to: "/contact", label: "Contact" },
      { to: "/help", label: "Help Center" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/security", label: "Security" },
      { to: "/gdpr", label: "GDPR" },
      { to: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto container-x max-w-7xl py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The smartest attendance & workforce management software for modern teams.
              Track, manage, and pay — from anywhere.
            </p>
            <div className="mt-6 flex gap-3 text-muted-foreground">
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="GitHub" className="hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Punchly. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            All systems operational · 99.99% uptime
          </p>
        </div>
      </div>
    </footer>
  );
}
