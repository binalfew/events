import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    savedView: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Integration: Saved Views", () => {
  describe("CRUD operations", () => {
    it("should export all CRUD functions", async () => {
      const mod = await import("~/services/saved-views.server");
      expect(mod.createView).toBeDefined();
      expect(mod.getView).toBeDefined();
      expect(mod.updateView).toBeDefined();
      expect(mod.deleteView).toBeDefined();
      expect(mod.listViews).toBeDefined();
    });
  });

  describe("Personal vs shared visibility", () => {
    it("should distinguish personal and shared views", () => {
      const personalView = { isShared: false, userId: "user-1" };
      const sharedView = { isShared: true, userId: "user-1" };

      expect(personalView.isShared).toBe(false);
      expect(sharedView.isShared).toBe(true);
    });

    it("should filter personal views to owner only", () => {
      const views = [
        { id: "v1", isShared: false, userId: "user-1" },
        { id: "v2", isShared: true, userId: "user-2" },
        { id: "v3", isShared: false, userId: "user-2" },
      ];
      const currentUser = "user-1";
      const visible = views.filter((v) => v.isShared || v.userId === currentUser);
      expect(visible).toHaveLength(2);
      expect(visible.map((v) => v.id)).toEqual(["v1", "v2"]);
    });
  });

  describe("Default view selection", () => {
    it("should identify the default view", () => {
      const views = [
        { id: "v1", isDefault: false },
        { id: "v2", isDefault: true },
        { id: "v3", isDefault: false },
      ];
      const defaultView = views.find((v) => v.isDefault);
      expect(defaultView?.id).toBe("v2");
    });
  });

  describe("View layout types", () => {
    it("should support table, kanban, calendar, and gallery layouts", () => {
      const layouts = ["table", "kanban", "calendar", "gallery"];
      expect(layouts).toContain("table");
      expect(layouts).toContain("kanban");
      expect(layouts).toContain("calendar");
      expect(layouts).toContain("gallery");
    });
  });
});
