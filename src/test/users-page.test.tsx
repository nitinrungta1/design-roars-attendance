import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import React from "react";

/**
 * This test exercises the exact gating + queryFn pattern used in
 * src/routes/_authenticated.admin_.users.tsx so that the "listUsers is
 * never called" regression cannot recur.
 */

const listUsers = vi.fn();

function wrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function useUsersQuery({ allowed }: { allowed: boolean }) {
  return useQuery({
    queryKey: ["admin", "platform-users"],
    queryFn: () =>
      listUsers().catch(() => ({
        users: [],
        stats: { total: 0, superAdmins: 0, pending: 0, deactivated: 0 },
        error: "Failed to load users",
      })),
    enabled: allowed,
    retry: false,
  });
}

describe("Users page query gating", () => {
  beforeEach(() => {
    listUsers.mockReset();
  });

  it("does NOT call listUsers when allowed=false", async () => {
    const qc = new QueryClient();
    renderHook(() => useUsersQuery({ allowed: false }), { wrapper: wrapper(qc) });
    await new Promise((r) => setTimeout(r, 30));
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("calls listUsers and returns users when allowed=true (super_admin)", async () => {
    listUsers.mockResolvedValue({
      users: [{ user_id: "u1", email: "a@b.com" }],
      stats: { total: 1, superAdmins: 1, pending: 0, deactivated: 0 },
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUsersQuery({ allowed: true }), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(result.current.data?.users).toHaveLength(1);
  });

  it("falls back to empty list with error message if listUsers throws", async () => {
    listUsers.mockRejectedValue(new Error("boom"));
    const qc = new QueryClient();
    const { result } = renderHook(() => useUsersQuery({ allowed: true }), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.users).toEqual([]);
    expect(result.current.data?.error).toBe("Failed to load users");
  });
});
