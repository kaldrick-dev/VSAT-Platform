import { describe, expect, it } from "vitest";
import { ROLES, canAccess, pagesFor, safeNext, PAGES } from "./access.js";

const page = (path) => PAGES.find((p) => p.path === path);

describe("access policy", () => {
  it("keeps /vendor and /admin away from the public", () => {
    expect(canAccess(page("/vendor"), ROLES.PUBLIC)).toBe(false);
    expect(canAccess(page("/admin"), ROLES.PUBLIC)).toBe(false);
  });
  it("separates vendor and admin workspaces", () => {
    expect(canAccess(page("/vendor"), ROLES.ADMIN)).toBe(false);
    expect(canAccess(page("/admin"), ROLES.VENDOR)).toBe(false);
  });
  it("keeps admin tools away from vendors and the public", () => {
    for (const path of ["/admin/sites", "/admin/flags", "/admin/log"]) {
      expect(canAccess(page(path), ROLES.ADMIN)).toBe(true);
      expect(canAccess(page(path), ROLES.VENDOR)).toBe(false);
      expect(canAccess(page(path), ROLES.PUBLIC)).toBe(false);
    }
  });
  it("gives vendors their own tools only", () => {
    for (const path of ["/flags", "/profile"]) {
      expect(canAccess(page(path), ROLES.VENDOR)).toBe(true);
      expect(canAccess(page(path), ROLES.ADMIN)).toBe(false);
    }
  });
  it("shares notifications, help, the map and overview across workspace roles", () => {
    for (const path of ["/workspace", "/sites", "/notifications", "/help"]) {
      expect(canAccess(page(path), ROLES.VENDOR)).toBe(true);
      expect(canAccess(page(path), ROLES.ADMIN)).toBe(true);
      expect(canAccess(page(path), ROLES.PUBLIC)).toBe(false);
    }
  });
  it("lets association representatives read and flag, but not apply or manage", () => {
    for (const path of ["/workspace", "/sites", "/flags", "/notifications", "/help"]) {
      expect(canAccess(page(path), ROLES.ASSOCIATION)).toBe(true);
    }
    for (const path of ["/vendor", "/profile", "/admin", "/admin/sites", "/admin/flags", "/admin/log"]) {
      expect(canAccess(page(path), ROLES.ASSOCIATION)).toBe(false);
    }
  });
  it("does not list public records in the workspace", () => {
    expect(PAGES.some((p) => p.path === "/records")).toBe(false);
  });
  it("rejects open-redirect targets", () => {
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("/sites")).toBe("/sites");
  });
});
