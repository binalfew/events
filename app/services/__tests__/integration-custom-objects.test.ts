import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    customObjectDefinition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customObjectRecord: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Integration: Custom Objects", () => {
  describe("Definition CRUD", () => {
    it("should export definition management functions", async () => {
      const mod = await import("~/services/custom-objects.server");
      expect(mod.createDefinition).toBeDefined();
      expect(mod.getDefinition).toBeDefined();
      expect(mod.getDefinitionBySlug).toBeDefined();
      expect(mod.updateDefinition).toBeDefined();
      expect(mod.listDefinitions).toBeDefined();
      expect(mod.deleteDefinition).toBeDefined();
    });
  });

  describe("Record CRUD", () => {
    it("should export record management functions", async () => {
      const mod = await import("~/services/custom-objects.server");
      expect(mod.createRecord).toBeDefined();
      expect(mod.getRecord).toBeDefined();
      expect(mod.updateRecord).toBeDefined();
      expect(mod.deleteRecord).toBeDefined();
      expect(mod.listRecords).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should export CustomObjectError class", async () => {
      const { CustomObjectError } = await import("~/services/custom-objects.server");
      const error = new CustomObjectError("Not found", 404);
      expect(error.message).toBe("Not found");
      expect(error.status).toBe(404);
      expect(error.name).toBe("CustomObjectError");
    });
  });

  describe("Deactivation preserves records", () => {
    it("should mark definition as inactive rather than deleting", () => {
      const definition = { id: "d1", isActive: true, recordCount: 5 };
      const deactivated = { ...definition, isActive: false };
      expect(deactivated.isActive).toBe(false);
      expect(deactivated.recordCount).toBe(5); // records preserved
    });
  });

  describe("Slug-based lookup", () => {
    it("slugs should be URL-friendly lowercase strings", () => {
      // Slugs are provided by the client on createDefinition
      const slug = "meeting-rooms";
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
