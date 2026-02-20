import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockQueryRawUnsafe = vi.fn();
const mockTransaction = vi.fn();
const mockAuditCreate = vi.fn();
const mockEventFindFirst = vi.fn();
const mockPtFindFirst = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    fieldDefinition: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      count: mockCount,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
    event: {
      findFirst: mockEventFindFirst,
    },
    participantType: {
      findFirst: mockPtFindFirst,
    },
    auditLog: {
      create: mockAuditCreate,
    },
    $queryRawUnsafe: mockQueryRawUnsafe,
    $transaction: mockTransaction,
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const ctx = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

describe("fields.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  describe("listFields", () => {
    it("returns fields for a tenant ordered by sortOrder", async () => {
      const { listFields } = await import("../fields.server");
      const mockFields = [
        { id: "f1", name: "field_a", sortOrder: 0 },
        { id: "f2", name: "field_b", sortOrder: 1 },
      ];
      mockFindMany.mockResolvedValue(mockFields);

      const result = await listFields("tenant-1");

      expect(result).toEqual(mockFields);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("applies filters when provided", async () => {
      const { listFields } = await import("../fields.server");
      mockFindMany.mockResolvedValue([]);

      await listFields("tenant-1", {
        eventId: "event-1",
        entityType: "Participant",
        dataType: "TEXT",
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: "tenant-1",
          eventId: "event-1",
          entityType: "Participant",
          dataType: "TEXT",
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("applies search filter across name and label", async () => {
      const { listFields } = await import("../fields.server");
      mockFindMany.mockResolvedValue([]);

      await listFields("tenant-1", { search: "country" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: "tenant-1",
          OR: [
            { name: { contains: "country", mode: "insensitive" } },
            { label: { contains: "country", mode: "insensitive" } },
          ],
        },
        orderBy: { sortOrder: "asc" },
      });
    });
  });

  describe("createField", () => {
    const validInput = {
      eventId: "event-1",
      entityType: "Participant" as const,
      name: "country_code",
      label: "Country Code",
      dataType: "TEXT" as const,
      isRequired: false,
      isUnique: false,
      isSearchable: false,
      isFilterable: false,
      config: {},
      validation: [],
    };

    it("creates a field and returns it", async () => {
      const { createField } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue(null);
      const createdField = { id: "f1", ...validInput, tenantId: "tenant-1", sortOrder: 0 };
      mockCreate.mockResolvedValue(createdField);

      const result = await createField(validInput, ctx);

      expect(result).toEqual(createdField);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          name: "country_code",
          label: "Country Code",
          dataType: "TEXT",
          sortOrder: 0,
        }),
      });
    });

    it("throws 404 when event not found", async () => {
      const { createField, FieldError } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue(null);

      await expect(createField(validInput, ctx)).rejects.toThrow(FieldError);
      await expect(createField(validInput, ctx)).rejects.toMatchObject({ status: 404 });
    });

    it("creates a global field when eventId is omitted", async () => {
      const { createField } = await import("../fields.server");
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue(null); // no existing fields for sortOrder
      mockCreate.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        eventId: null,
        entityType: "Participant",
        name: "badge_name",
        label: "Badge Name",
        dataType: "TEXT",
        sortOrder: 0,
        isRequired: false,
        isUnique: false,
        isSearchable: false,
        isFilterable: false,
        config: {},
        validation: [],
      });
      mockAuditCreate.mockResolvedValue({});

      const { eventId: _, ...globalInput } = validInput;
      const result = await createField(
        { ...globalInput, name: "badge_name", label: "Badge Name" },
        ctx,
      );
      expect(result.eventId).toBeNull();
      // Should not have called event.findFirst since no eventId
      expect(mockEventFindFirst).not.toHaveBeenCalled();
    });

    it("enforces tenant-wide limit", async () => {
      const { createField } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(500);

      await expect(createField(validInput, ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("enforces per-event limit", async () => {
      const { createField } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValueOnce(10).mockResolvedValueOnce(100);

      await expect(createField(validInput, ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("throws 409 on unique constraint violation", async () => {
      const { createField } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockRejectedValue({ code: "P2002" });

      await expect(createField(validInput, ctx)).rejects.toMatchObject({ status: 409 });
    });

    it("auto-sets sortOrder based on existing max", async () => {
      const { createField } = await import("../fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue({ sortOrder: 5 });
      mockCreate.mockResolvedValue({ id: "f1", sortOrder: 6 });

      await createField(validInput, ctx);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 6 }),
      });
    });
  });

  describe("updateField", () => {
    it("updates an existing field", async () => {
      const { updateField } = await import("../fields.server");
      const existing = {
        id: "f1",
        tenantId: "tenant-1",
        name: "old_name",
        label: "Old",
        dataType: "TEXT",
      };
      mockFindFirst.mockResolvedValue(existing);
      const updated = { ...existing, label: "New Label" };
      mockUpdate.mockResolvedValue(updated);

      const result = await updateField("f1", { label: "New Label" }, ctx);

      expect(result).toEqual(updated);
    });

    it("throws 404 when field not found", async () => {
      const { updateField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue(null);

      await expect(updateField("f1", { label: "New" }, ctx)).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 409 on unique constraint violation", async () => {
      const { updateField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "old",
        label: "Old",
        dataType: "TEXT",
      });
      mockUpdate.mockRejectedValue({ code: "P2002" });

      await expect(updateField("f1", { name: "duplicate_name" }, ctx)).rejects.toMatchObject({
        status: 409,
      });
    });

    it("succeeds when expectedVersion matches", async () => {
      const { updateField } = await import("../fields.server");
      const existing = {
        id: "f1",
        tenantId: "tenant-1",
        name: "old_name",
        label: "Old",
        dataType: "TEXT",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      };
      mockFindFirst.mockResolvedValue(existing);
      mockUpdate.mockResolvedValue({ ...existing, label: "New Label" });

      const result = await updateField(
        "f1",
        { label: "New Label" },
        ctx,
        "2026-02-15T10:00:00.000Z",
      );

      expect(result.label).toBe("New Label");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "f1", updatedAt: new Date("2026-02-15T10:00:00.000Z") },
        }),
      );
    });

    it("throws ConflictError when expectedVersion does not match", async () => {
      const { updateField } = await import("../fields.server");
      const { ConflictError } = await import("~/services/optimistic-lock.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "old_name",
        label: "Old",
        dataType: "TEXT",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      });

      await expect(
        updateField("f1", { label: "New" }, ctx, "2026-02-15T09:00:00.000Z"),
      ).rejects.toThrow(ConflictError);
    });

    it("converts Prisma P2025 to ConflictError during versioned update", async () => {
      const { updateField } = await import("../fields.server");
      const { ConflictError } = await import("~/services/optimistic-lock.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "old_name",
        label: "Old",
        dataType: "TEXT",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      });
      mockUpdate.mockRejectedValue({ code: "P2025" });

      await expect(
        updateField("f1", { label: "New" }, ctx, "2026-02-15T10:00:00.000Z"),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("deleteField", () => {
    it("deletes a field when no data exists", async () => {
      const { deleteField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "field_a",
        label: "Field A",
        entityType: "Participant",
        dataType: "TEXT",
      });
      mockQueryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }]);
      mockDelete.mockResolvedValue({});

      const result = await deleteField("f1", ctx);

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "f1" } });
    });

    it("throws 404 when field not found", async () => {
      const { deleteField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue(null);

      await expect(deleteField("f1", ctx)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 422 when data exists and force is not set", async () => {
      const { deleteField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "field_a",
        label: "Field A",
        entityType: "Participant",
        dataType: "TEXT",
      });
      mockQueryRawUnsafe.mockResolvedValue([{ count: BigInt(5) }]);

      await expect(deleteField("f1", ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("deletes even with data when force is true", async () => {
      const { deleteField } = await import("../fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "field_a",
        label: "Field A",
        entityType: "Participant",
        dataType: "TEXT",
      });
      mockDelete.mockResolvedValue({});

      const result = await deleteField("f1", ctx, { force: true });

      expect(result).toEqual({ success: true });
      expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe("reorderFields", () => {
    it("reorders fields within a transaction", async () => {
      const { reorderFields } = await import("../fields.server");
      const fieldIds = ["f1", "f2", "f3"];
      mockFindMany.mockResolvedValue(fieldIds.map((id) => ({ id })));
      mockTransaction.mockResolvedValue([]);

      const result = await reorderFields({ fieldIds }, ctx);

      expect(result).toEqual({ success: true });
      expect(mockTransaction).toHaveBeenCalledWith(
        fieldIds.map((id, index) => expect.objectContaining({})),
      );
    });

    it("throws 404 when some fields not found", async () => {
      const { reorderFields } = await import("../fields.server");
      mockFindMany.mockResolvedValue([{ id: "f1" }]);

      await expect(reorderFields({ fieldIds: ["f1", "f2"] }, ctx)).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe("getEffectiveFields", () => {
    it("merges global and event-specific fields", async () => {
      const { getEffectiveFields } = await import("../fields.server");
      const globalField = {
        id: "g1",
        tenantId: "tenant-1",
        eventId: null,
        entityType: "Participant",
        name: "badge_name",
        label: "Badge Name",
        dataType: "TEXT",
        sortOrder: 0,
      };
      const eventField = {
        id: "e1",
        tenantId: "tenant-1",
        eventId: "event-1",
        entityType: "Participant",
        name: "passport_number",
        label: "Passport Number",
        dataType: "TEXT",
        sortOrder: 1,
      };
      mockFindMany.mockResolvedValue([globalField, eventField]);

      const result = await getEffectiveFields("tenant-1", "event-1", "Participant");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("badge_name");
      expect(result[1].name).toBe("passport_number");
    });

    it("event-specific field overrides global field with same name", async () => {
      const { getEffectiveFields } = await import("../fields.server");
      const globalField = {
        id: "g1",
        tenantId: "tenant-1",
        eventId: null,
        entityType: "Participant",
        name: "dietary_requirements",
        label: "Dietary Requirements (Global)",
        dataType: "ENUM",
        sortOrder: 0,
      };
      const eventOverride = {
        id: "e1",
        tenantId: "tenant-1",
        eventId: "event-1",
        entityType: "Participant",
        name: "dietary_requirements",
        label: "Dietary Requirements (Event)",
        dataType: "ENUM",
        sortOrder: 1,
      };
      mockFindMany.mockResolvedValue([globalField, eventOverride]);

      const result = await getEffectiveFields("tenant-1", "event-1", "Participant");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
      expect(result[0].label).toBe("Dietary Requirements (Event)");
    });

    it("returns only global fields when event has no fields", async () => {
      const { getEffectiveFields } = await import("../fields.server");
      const globalField = {
        id: "g1",
        tenantId: "tenant-1",
        eventId: null,
        entityType: "Participant",
        name: "badge_name",
        label: "Badge Name",
        dataType: "TEXT",
        sortOrder: 0,
      };
      mockFindMany.mockResolvedValue([globalField]);

      const result = await getEffectiveFields("tenant-1", "event-1", "Participant");
      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBeNull();
    });
  });

  describe("listFields with scope", () => {
    it("lists only global fields when scope is global", async () => {
      const { listFields } = await import("../fields.server");
      mockFindMany.mockResolvedValue([]);

      await listFields("tenant-1", { scope: "global" });
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventId: null }),
        }),
      );
    });

    it("lists only event fields when scope is event", async () => {
      const { listFields } = await import("../fields.server");
      mockFindMany.mockResolvedValue([]);

      await listFields("tenant-1", { scope: "event", eventId: "event-1" });
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventId: "event-1" }),
        }),
      );
    });
  });
});
