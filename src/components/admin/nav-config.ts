import {
  LayoutDashboard,
  Building2,
  UsersRound,
  Clock,
  CalendarRange,
  ClipboardList,
  CreditCard,
  Receipt,
  Tag,
  Globe,
  FileText,
  Newspaper,
  Briefcase,
  Image as ImageIcon,
  Filter,
  LifeBuoy,
  MessageSquare,
  BookOpen,
  Timer,
  BarChart3,
  TrendingUp,
  GitBranch,
  ShieldCheck,
  Users,
  KeyRound,
  Group,
  Mail,
  Smartphone,
  MessageCircle,
  Wallet,
  Plug,
  Webhook,
  Settings,
  ScrollText,
  Lock,
  HardDrive,
  Sparkles,
  Bell,
  Sun,
  Inbox,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permission key required to see this item. Empty/undefined = anyone authenticated. */
  permission?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { to: "/admin", label: "SaaS Overview", icon: Sparkles, permission: "dashboard.read" },
      { to: "/admin/dashboard/revenue", label: "Revenue", icon: TrendingUp, permission: "dashboard.platform.read" },
      { to: "/admin/dashboard/trials", label: "Trials", icon: Timer, permission: "dashboard.platform.read" },
      { to: "/admin/dashboard/growth", label: "Growth Metrics", icon: BarChart3, permission: "dashboard.platform.read" },
      { to: "/admin/dashboard/alerts", label: "Alerts", icon: Bell, permission: "dashboard.read" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Building2,
    items: [
      { to: "/admin/customers/companies", label: "Companies", icon: Building2, permission: "customers.companies.read" },
      { to: "/admin/customers/accounts", label: "Accounts", icon: UsersRound, permission: "customers.companies.read" },
      { to: "/admin/customers/contacts", label: "Contacts", icon: Users, permission: "customers.contacts.read" },
      { to: "/admin/customers/plans", label: "Plans", icon: Tag, permission: "billing.plans.read" },
      { to: "/admin/customers/usage", label: "Usage", icon: BarChart3, permission: "customers.usage.read" },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: UsersRound,
    items: [
      { to: "/admin/workforce", label: "Workforce Dashboard", icon: LayoutDashboard, permission: "workforce.dashboard.read" },
      { to: "/admin/workforce/employees", label: "Employee Directory", icon: Users, permission: "workforce.directory.read" },
      { to: "/admin/workforce/departments", label: "Departments", icon: Group, permission: "workforce.directory.read" },
      { to: "/admin/workforce/designations", label: "Designations", icon: Tag, permission: "workforce.directory.read" },
      { to: "/admin/workforce/teams", label: "Teams", icon: Users, permission: "workforce.directory.read" },
      { to: "/admin/workforce/rules", label: "Workforce Rules", icon: ShieldCheck, permission: "workforce.rules.manage" },
      { to: "/admin/workforce/attendance", label: "Attendance Automation", icon: Clock, permission: "workforce.attendance.read" },
      { to: "/admin/workforce/shifts", label: "Shifts & Schedules", icon: CalendarRange, permission: "workforce.schedules.read" },
      { to: "/admin/workforce/roster", label: "Roster Planner", icon: CalendarRange, permission: "workforce.schedules.manage" },
      { to: "/admin/workforce/approvals", label: "Approvals Inbox", icon: Inbox, permission: "workforce.approvals.manage" },
      { to: "/admin/workforce/timesheets", label: "Timesheets", icon: ClipboardList, permission: "workforce.timesheets.read" },
      { to: "/admin/workforce/overtime", label: "Overtime", icon: Timer, permission: "workforce.timesheets.read" },
      { to: "/admin/workforce/leave", label: "Leave", icon: Sun, permission: "workforce.leave.write" },
      { to: "/admin/workforce/holidays", label: "Holidays", icon: CalendarRange, permission: "workforce.holidays.read" },
      { to: "/admin/workforce/productivity", label: "Productivity", icon: BarChart3, permission: "workforce.productivity.read" },
      { to: "/admin/workforce/assets", label: "Assets", icon: HardDrive, permission: "workforce.assets.manage" },
      { to: "/admin/workforce/documents", label: "Documents", icon: FileText, permission: "workforce.documents.manage" },
      { to: "/admin/workforce/announcements", label: "Announcements", icon: Megaphone, permission: "workforce.announcements.manage" },
    ],
  },
  {
    id: "billing",
    label: "Sales & Billing",
    icon: CreditCard,
    items: [
      { to: "/admin/billing/plans", label: "Plans", icon: Tag, permission: "billing.plans.read" },
      { to: "/admin/billing/subscriptions", label: "Subscriptions", icon: CreditCard, permission: "billing.subscriptions.read" },
      { to: "/admin/billing/invoices", label: "Invoices", icon: Receipt, permission: "billing.invoices.read" },
      { to: "/admin/billing/payments", label: "Payments", icon: Wallet, permission: "billing.payments.read" },
      { to: "/admin/billing/taxes", label: "Taxes", icon: Receipt, permission: "billing.invoices.read" },
      { to: "/admin/billing/coupons", label: "Coupons", icon: Tag, permission: "billing.coupons.write" },
    ],
  },
  {
    id: "leads",
    label: "Leads / CRM",
    icon: Filter,
    items: [
      { to: "/admin/leads", label: "Pipeline", icon: GitBranch, permission: "leads.read" },
      { to: "/admin/leads/forms", label: "Form Submissions", icon: FileText, permission: "leads.read" },
    ],
  },
  {
    id: "cms",
    label: "Website CMS",
    icon: Globe,
    items: [
      { to: "/admin/cms/pages", label: "Pages", icon: FileText, permission: "cms.pages.write" },
      { to: "/admin/cms/blogs", label: "Blogs", icon: Newspaper, permission: "cms.blogs.write" },
      { to: "/admin/cms/seo", label: "SEO", icon: Globe, permission: "cms.seo.write" },
      { to: "/admin/cms/careers", label: "Careers", icon: Briefcase, permission: "cms.pages.write" },
      { to: "/admin/cms/forms", label: "Forms", icon: FileText, permission: "cms.pages.write" },
      { to: "/admin/cms/media", label: "Media", icon: ImageIcon, permission: "cms.media.write" },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: LifeBuoy,
    items: [
      { to: "/admin/support/tickets", label: "Tickets", icon: LifeBuoy, permission: "support.tickets.read" },
      { to: "/admin/support/chat", label: "Live Chat", icon: MessageSquare, permission: "support.tickets.read" },
      { to: "/admin/support/kb", label: "Knowledge Base", icon: BookOpen, permission: "support.kb.read" },
      { to: "/admin/support/sla", label: "SLA", icon: Timer, permission: "support.tickets.write" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { to: "/admin/analytics", label: "Dashboard", icon: BarChart3, permission: "analytics.read" },
      { to: "/admin/analytics/traffic", label: "Traffic", icon: TrendingUp, permission: "analytics.read" },
      { to: "/admin/analytics/attribution", label: "Attribution", icon: Filter, permission: "analytics.read" },
      { to: "/admin/analytics/campaigns", label: "Campaigns", icon: Megaphone, permission: "analytics.read" },
      { to: "/admin/analytics/funnel", label: "Funnel", icon: GitBranch, permission: "analytics.read" },
      { to: "/admin/analytics/settings", label: "Tracking Settings", icon: Settings, permission: "analytics.read" },
    ],
  },
  {
    id: "access",
    label: "Access Control",
    icon: ShieldCheck,
    items: [
      { to: "/admin/users", label: "Users", icon: Users, permission: "access.users.read" },
      { to: "/admin/access/roles", label: "Roles", icon: ShieldCheck, permission: "access.roles.write" },
      { to: "/admin/access/permissions", label: "Permissions", icon: KeyRound, permission: "access.roles.write" },
      { to: "/admin/access/teams", label: "Teams", icon: Group, permission: "access.teams.write" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    items: [
      { to: "/admin/integrations/email", label: "Email", icon: Mail, permission: "integrations.read" },
      { to: "/admin/integrations/sms", label: "SMS", icon: Smartphone, permission: "integrations.read" },
      { to: "/admin/integrations/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "integrations.read" },
      { to: "/admin/integrations/payments", label: "Payment Gateways", icon: Wallet, permission: "integrations.read" },
      { to: "/admin/integrations/apis", label: "APIs", icon: Plug, permission: "integrations.apikeys.write" },
      { to: "/admin/integrations/webhooks", label: "Webhooks", icon: Webhook, permission: "integrations.webhooks.write" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    items: [
      { to: "/admin/system/settings", label: "Settings", icon: Settings, permission: "system.settings.read" },
      { to: "/admin/system/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "system.audit.read" },
      { to: "/admin/system/security", label: "Security", icon: Lock, permission: "system.security.write" },
      { to: "/admin/system/backups", label: "Backups", icon: HardDrive, permission: "system.backups.write" },
    ],
  },
];

export function filterNavForUser(opts: {
  isSuperAdmin: boolean;
  hasPermission: (key: string) => boolean;
}): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (!i.permission) return true;
      if (opts.isSuperAdmin) return true;
      return opts.hasPermission(i.permission);
    }),
  })).filter((g) => g.items.length > 0);
}
