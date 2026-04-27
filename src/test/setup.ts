import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  // Each test starts with a clean localStorage and no leftover fetch mocks.
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  vi.unstubAllGlobals();
});
