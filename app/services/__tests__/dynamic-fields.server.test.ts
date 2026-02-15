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

describe("dynamic-fields.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  describe("listDynamicFields", () => {
    it("returns fields for a tenant ordered by sortOrder", async () => {
      const { listDynamicFields } = await import("../dynamic-fields.server");
      const mockFields = [
        { id: "f1", name: "field_a", sortOrder: 0 },
        { id: "f2", name: "field_b", sortOrder: 1 },
      ];
      mockFindMany.mockResolvedValue(mockFields);

      const result = await listDynamicFields("tenant-1");

      expect(result).toEqual(mockFields);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("applies filters when provided", async () => {
      const { listDynamicFields } = await import("../dynamic-fields.server");
      mockFindMany.mockResolvedValue([]);

      await listDynamicFields("tenant-1", {
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
      const { listDynamicFields } = await import("../dynamic-fields.server");
      mockFindMany.mockResolvedValue([]);

      await listDynamicFields("tenant-1", { search: "country" });

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

  describe("createDynamicField", () => {
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
      const { createDynamicField } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue(null);
      const createdField = { id: "f1", ...validInput, tenantId: "tenant-1", sortOrder: 0 };
      mockCreate.mockResolvedValue(createdField);

      const result = await createDynamicField(validInput, ctx);

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
      const { createDynamicField, DynamicFieldError } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue(null);

      await expect(createDynamicField(validInput, ctx)).rejects.toThrow(DynamicFieldError);
      await expect(createDynamicField(validInput, ctx)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 404 when participantType not found", async () => {
      const { createDynamicField, DynamicFieldError } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockPtFindFirst.mockResolvedValue(null);

      const inputWithPt = { ...validInput, participantTypeId: "pt-1" };
      await expect(createDynamicField(inputWithPt, ctx)).rejects.toThrow(DynamicFieldError);
      await expect(createDynamicField(inputWithPt, ctx)).rejects.toMatchObject({ status: 404 });
    });

    it("enforces tenant-wide limit", async () => {
      const { createDynamicField } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(500);

      await expect(createDynamicField(validInput, ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("enforces per-event limit", async () => {
      const { createDynamicField } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValueOnce(10).mockResolvedValueOnce(100);

      await expect(createDynamicField(validInput, ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("throws 409 on unique constraint violation", async () => {
      const { createDynamicField } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockRejectedValue({ code: "P2002" });

      await expect(createDynamicField(validInput, ctx)).rejects.toMatchObject({ status: 409 });
    });

    it("auto-sets sortOrder based on existing max", async () => {
      const { createDynamicField } = await import("../dynamic-fields.server");
      mockEventFindFirst.mockResolvedValue({ id: "event-1", tenantId: "tenant-1" });
      mockCount.mockResolvedValue(0);
      mockFindFirst.mockResolvedValue({ sortOrder: 5 });
      mockCreate.mockResolvedValue({ id: "f1", sortOrder: 6 });

      await createDynamicField(validInput, ctx);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 6 }),
      });
    });
  });

  describe("updateDynamicField", () => {
    it("updates an existing field", async () => {
      const { updateDynamicField } = await import("../dynamic-fields.server");
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

      const result = await updateDynamicField("f1", { label: "New Label" }, ctx);

      expect(result).toEqual(updated);
    });

    it("throws 404 when field not found", async () => {
      const { updateDynamicField } = await import("../dynamic-fields.server");
      mockFindFirst.mockResolvedValue(null);

      await expect(updateDynamicField("f1", { label: "New" }, ctx)).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 409 on unique constraint violation", async () => {
      const { updateDynamicField } = await import("../dynamic-fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "old",
        label: "Old",
        dataType: "TEXT",
      });
      mockUpdate.mockRejectedValue({ code: "P2002" });

      await expect(updateDynamicField("f1", { name: "duplicate_name" }, ctx)).rejects.toMatchObject(
        {
          status: 409,
        },
      );
    });
  });

  describe("deleteDynamicField", () => {
    it("deletes a field when no data exists", async () => {
      const { deleteDynamicField } = await import("../dynamic-fields.server");
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

      const result = await deleteDynamicField("f1", ctx);

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "f1" } });
    });

    it("throws 404 when field not found", async () => {
      const { deleteDynamicField } = await import("../dynamic-fields.server");
      mockFindFirst.mockResolvedValue(null);

      await expect(deleteDynamicField("f1", ctx)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 422 when data exists and force is not set", async () => {
      const { deleteDynamicField } = await import("../dynamic-fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "field_a",
        label: "Field A",
        entityType: "Participant",
        dataType: "TEXT",
      });
      mockQueryRawUnsafe.mockResolvedValue([{ count: BigInt(5) }]);

      await expect(deleteDynamicField("f1", ctx)).rejects.toMatchObject({ status: 422 });
    });

    it("deletes even with data when force is true", async () => {
      const { deleteDynamicField } = await import("../dynamic-fields.server");
      mockFindFirst.mockResolvedValue({
        id: "f1",
        tenantId: "tenant-1",
        name: "field_a",
        label: "Field A",
        entityType: "Participant",
        dataType: "TEXT",
      });
      mockDelete.mockResolvedValue({});

      const result = await deleteDynamicField("f1", ctx, { force: true });

      expect(result).toEqual({ success: true });
      expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe("reorderDynamicFields", () => {
    it("reorders fields within a transaction", async () => {
      const { reorderDynamicFields } = await import("../dynamic-fields.server");
      const fieldIds = ["f1", "f2", "f3"];
      mockFindMany.mockResolvedValue(fieldIds.map((id) => ({ id })));
      mockTransaction.mockResolvedValue([]);

      const result = await reorderDynamicFields({ fieldIds }, ctx);

      expect(result).toEqual({ success: true });
      expect(mockTransaction).toHaveBeenCalledWith(
        fieldIds.map((id, index) => expect.objectContaining({})),
      );
    });

    it("throws 404 when some fields not found", async () => {
      const { reorderDynamicFields } = await import("../dynamic-fields.server");
      mockFindMany.mockResolvedValue([{ id: "f1" }]);

      await expect(reorderDynamicFields({ fieldIds: ["f1", "f2"] }, ctx)).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
