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
  TrendingDown,
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
import type { AppRole } from "@/lib/auth";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Empty = anyone authenticated. */
  roles?: AppRole[];
  /** Hide from non-super-admin (platform admin only). */
  platform?: boolean;
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
      { to: "/admin", label: "SaaS Overview", icon: Sparkles },
      { to: "/admin/dashboard/revenue", label: "Revenue", icon: TrendingUp, platform: true },
      { to: "/admin/dashboard/trials", label: "Trials", icon: Timer, platform: true },
      { to: "/admin/dashboard/growth", label: "Growth Metrics", icon: BarChart3, platform: true },
      { to: "/admin/dashboard/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Building2,
    items: [
      { to: "/admin/customers/companies", label: "Companies", icon: Building2, platform: true },
      { to: "/admin/customers/accounts", label: "Accounts", icon: UsersRound, platform: true },
      { to: "/admin/customers/contacts", label: "Contacts", icon: Users, platform: true },
      { to: "/admin/customers/plans", label: "Plans", icon: Tag, platform: true },
      { to: "/admin/customers/usage", label: "Usage", icon: BarChart3, platform: true },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: UsersRound,
    items: [
      { to: "/admin/workforce", label: "Workforce Dashboard", icon: LayoutDashboard },
      { to: "/admin/workforce/employees", label: "Employee Directory", icon: Users },
      { to: "/admin/workforce/departments", label: "Departments", icon: Group },
      { to: "/admin/workforce/designations", label: "Designations", icon: Tag },
      { to: "/admin/workforce/teams", label: "Teams", icon: Users },
      { to: "/admin/workforce/rules", label: "Workforce Rules", icon: ShieldCheck },
      { to: "/admin/workforce/attendance", label: "Attendance Automation", icon: Clock },
      { to: "/admin/workforce/shifts", label: "Shifts & Schedules", icon: CalendarRange },
      { to: "/admin/workforce/roster", label: "Roster Planner", icon: CalendarRange },
      { to: "/admin/workforce/approvals", label: "Approvals Inbox", icon: Inbox },
      { to: "/admin/workforce/timesheets", label: "Timesheets", icon: ClipboardList },
      { to: "/admin/workforce/overtime", label: "Overtime", icon: Timer },
      { to: "/admin/workforce/leave", label: "Leave", icon: Sun },
      { to: "/admin/workforce/holidays", label: "Holidays", icon: CalendarRange },
      { to: "/admin/workforce/productivity", label: "Productivity", icon: BarChart3 },
      { to: "/admin/workforce/assets", label: "Assets", icon: HardDrive },
      { to: "/admin/workforce/documents", label: "Documents", icon: FileText },
      { to: "/admin/workforce/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    id: "billing",
    label: "Sales & Billing",
    icon: CreditCard,
    items: [
      { to: "/admin/billing/plans", label: "Plans", icon: Tag, platform: true },
      { to: "/admin/billing/subscriptions", label: "Subscriptions", icon: CreditCard, platform: true },
      { to: "/admin/billing/invoices", label: "Invoices", icon: Receipt, platform: true },
      { to: "/admin/billing/payments", label: "Payments", icon: Wallet, platform: true },
      { to: "/admin/billing/taxes", label: "Taxes", icon: Receipt, platform: true },
      { to: "/admin/billing/coupons", label: "Coupons", icon: Tag, platform: true },
    ],
  },
  {
    id: "leads",
    label: "Leads / CRM",
    icon: Filter,
    items: [
      { to: "/admin/leads", label: "Pipeline", icon: GitBranch, platform: true },
      { to: "/admin/leads/forms", label: "Form Submissions", icon: FileText, platform: true },
    ],
  },
  {
    id: "cms",
    label: "Website CMS",
    icon: Globe,
    items: [
      { to: "/admin/cms/pages", label: "Pages", icon: FileText, platform: true },
      { to: "/admin/cms/blogs", label: "Blogs", icon: Newspaper, platform: true },
      { to: "/admin/cms/seo", label: "SEO", icon: Globe, platform: true },
      { to: "/admin/cms/careers", label: "Careers", icon: Briefcase, platform: true },
      { to: "/admin/cms/forms", label: "Forms", icon: FileText, platform: true },
      { to: "/admin/cms/media", label: "Media", icon: ImageIcon, platform: true },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: LifeBuoy,
    items: [
      { to: "/admin/support/tickets", label: "Tickets", icon: LifeBuoy },
      { to: "/admin/support/chat", label: "Live Chat", icon: MessageSquare },
      { to: "/admin/support/kb", label: "Knowledge Base", icon: BookOpen },
      { to: "/admin/support/sla", label: "SLA", icon: Timer, platform: true },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { to: "/admin/analytics/product", label: "Product Usage", icon: BarChart3, platform: true },
      { to: "/admin/analytics/churn", label: "Churn", icon: TrendingDown, platform: true },
      { to: "/admin/analytics/acquisition", label: "Acquisition", icon: TrendingUp, platform: true },
      { to: "/admin/analytics/retention", label: "Retention", icon: BarChart3, platform: true },
      { to: "/admin/analytics/funnels", label: "Conversion Funnels", icon: GitBranch, platform: true },
    ],
  },
  {
    id: "access",
    label: "Access Control",
    icon: ShieldCheck,
    items: [
      { to: "/admin/access/users", label: "Users", icon: Users },
      { to: "/admin/access/roles", label: "Roles", icon: ShieldCheck },
      { to: "/admin/access/permissions", label: "Permissions", icon: KeyRound },
      { to: "/admin/access/teams", label: "Teams", icon: Group },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    items: [
      { to: "/admin/integrations/email", label: "Email", icon: Mail, platform: true },
      { to: "/admin/integrations/sms", label: "SMS", icon: Smartphone, platform: true },
      { to: "/admin/integrations/whatsapp", label: "WhatsApp", icon: MessageCircle, platform: true },
      { to: "/admin/integrations/payments", label: "Payment Gateways", icon: Wallet, platform: true },
      { to: "/admin/integrations/apis", label: "APIs", icon: Plug, platform: true },
      { to: "/admin/integrations/webhooks", label: "Webhooks", icon: Webhook, platform: true },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    items: [
      { to: "/admin/system/settings", label: "Settings", icon: Settings },
      { to: "/admin/system/audit-logs", label: "Audit Logs", icon: ScrollText, platform: true },
      { to: "/admin/system/security", label: "Security", icon: Lock, platform: true },
      { to: "/admin/system/backups", label: "Backups", icon: HardDrive, platform: true },
    ],
  },
];

export function filterNavForUser(opts: { isSuperAdmin: boolean; isAdmin: boolean }): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.platform && !opts.isSuperAdmin && !opts.isAdmin) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);
}
