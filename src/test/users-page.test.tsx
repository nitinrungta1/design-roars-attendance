import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the platform-users server function module
const listUsersMock = vi.fn();
vi.mock("@/lib/platform-users.functions", async () => {
  const actual = await vi.importActual<any>("@/lib/platform-users.functions");
  return {
    ...actual,
    listUsers: (...args: any[]) => listUsersMock(...args),
    PLATFORM_ROLES: ["super_admin", "admin", "manager", "employee"],
  };
});

// Mock @/lib/auth to drive isSuperAdmin / hasPermission
const useAuthMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => useAuthMock(),
}));

// Mock heavy admin shells and tanstack router Link to avoid full router setup
vi.mock("@/components/admin/platform-shell", () => ({
  PlatformShell: ({ children }: any) => <div data-testid="shell">{children}</div>,
}));
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<any>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...rest }: any) => <a {...rest}>{children}</a>,
    createFileRoute: () => (config: any) => ({ ...config, useParams: () => ({}) }),
  };
});

import("@/routes/_authenticated.admin_.users").then(() => {});

function renderUsersPage() {
  // Dynamically require after mocks set up
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/routes/_authenticated.admin_.users");
  const Component = (mod.Route as any).options?.component ?? (mod.Route as any).component;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Component />
    </QueryClientProvider>,
  );
}

describe("Users page (admin) - listUsers gating", () => {
  beforeEach(() => {
    listUsersMock.mockReset();
    useAuthMock.mockReset();
  });

  it("calls listUsers when user is super_admin", async () => {
    listUsersMock.mockResolvedValue({
      users: [
        { user_id: "u1", email: "a@b.com", full_name: "Alice", avatar_url: null, role: "super_admin", permissions: {}, status: "active", joined_at: "2024-01-01", email_confirmed_at: "2024-01-01", banned_until: null, company_id: null },
      ],
      stats: { total: 1, superAdmins: 1, pending: 0, deactivated: 0 },
    });
    useAuthMock.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => true,
      loading: false,
    });

    renderUsersPage();
    // Wait for the query to be enabled and called
    await new Promise((r) => setTimeout(r, 50));
    expect(listUsersMock).toHaveBeenCalled();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("does NOT call listUsers when user is plain employee", async () => {
    listUsersMock.mockResolvedValue({ users: [], stats: { total: 0, superAdmins: 0, pending: 0, deactivated: 0 } });
    useAuthMock.mockReturnValue({
      isSuperAdmin: false,
      hasPermission: () => false,
      loading: false,
    });

    renderUsersPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(listUsersMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Permission required/i)).toBeInTheDocument();
  });
});
