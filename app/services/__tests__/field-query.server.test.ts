import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFieldDefFindMany = vi.fn();
const mockQueryRawUnsafe = vi.fn();
const mockExecuteRawUnsafe = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    fieldDefinition: {
      findMany: mockFieldDefFindMany,
    },
    auditLog: {
      create: mockAuditCreate,
    },
    $queryRawUnsafe: mockQueryRawUnsafe,
    $executeRawUnsafe: mockExecuteRawUnsafe,
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

describe("field-query.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  describe("filterWithFields", () => {
    const baseParams = {
      tenantId: "tenant-1",
      eventId: "event-1",
      conditions: [],
      limit: 50,
      offset: 0,
      orderBy: "createdAt",
      orderDir: "desc" as const,
    };

    it("queries with tenant isolation and soft-delete filter", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields(baseParams);

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain('"tenantId" = $1');
      expect(countSql).toContain('"eventId" = $2');
      expect(countSql).toContain('"deletedAt" IS NULL');
      expect(mockQueryRawUnsafe.mock.calls[0][1]).toBe("tenant-1");
      expect(mockQueryRawUnsafe.mock.calls[0][2]).toBe("event-1");
    });

    it("builds equality condition for text field", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "country", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ id: "p1", extras: { country: "US" } }]);

      const result = await filterWithFields({
        ...baseParams,
        conditions: [{ field: "country", operator: "eq", value: "US" }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras"->>'country') = $3`);
      expect(mockQueryRawUnsafe.mock.calls[0][3]).toBe("US");
      expect(result.total).toBe(1);
    });

    it("builds numeric gt condition with cast", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "age", dataType: "NUMBER", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "age", operator: "gt", value: 25 }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`(("extras"->>'age')::NUMERIC) > $3`);
      expect(mockQueryRawUnsafe.mock.calls[0][3]).toBe(25);
    });

    it("builds contains condition with ILIKE", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "notes", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "notes", operator: "contains", value: "important" }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras"->>'notes') ILIKE $3`);
      expect(mockQueryRawUnsafe.mock.calls[0][3]).toBe("%important%");
    });

    it("builds startsWith condition with ILIKE", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "code", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "code", operator: "startsWith", value: "ABC" }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras"->>'code') ILIKE $3`);
      expect(mockQueryRawUnsafe.mock.calls[0][3]).toBe("ABC%");
    });

    it("builds in condition with ANY", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "status_field", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      const values = ["active", "pending"];
      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "status_field", operator: "in", value: values }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`= ANY($3)`);
      expect(mockQueryRawUnsafe.mock.calls[0][3]).toEqual(values);
    });

    it("builds isNull condition with key existence check", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "optional_field", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "optional_field", operator: "isNull" }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras" ? 'optional_field') = false`);
      // isNull should not add a parameter
      expect(mockQueryRawUnsafe.mock.calls[0].length).toBe(3); // sql + tenantId + eventId
    });

    it("builds isNotNull condition with key existence check", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "optional_field", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [{ field: "optional_field", operator: "isNotNull" }],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras" ? 'optional_field') = true`);
    });

    it("joins multiple conditions with AND", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "country", dataType: "TEXT", isSearchable: true, isFilterable: true },
        { name: "age", dataType: "NUMBER", isSearchable: true, isFilterable: true },
      ]);
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(0) }]).mockResolvedValueOnce([]);

      await filterWithFields({
        ...baseParams,
        conditions: [
          { field: "country", operator: "eq", value: "US" },
          { field: "age", operator: "gte", value: 18 },
        ],
      });

      const countSql = mockQueryRawUnsafe.mock.calls[0][0] as string;
      expect(countSql).toContain(`("extras"->>'country') = $3`);
      expect(countSql).toContain(`(("extras"->>'age')::NUMERIC) >= $4`);
      expect(countSql).toContain(" AND ");
    });

    it("applies pagination with LIMIT and OFFSET", async () => {
      const { filterWithFields } = await import("../field-query.server");
      mockFieldDefFindMany.mockResolvedValue([]);
      mockQueryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(100) }])
        .mockResolvedValueOnce([{ id: "p1" }]);

      const result = await filterWithFields({
        ...baseParams,
        limit: 10,
        offset: 20,
      });

      const dataSql = mockQueryRawUnsafe.mock.calls[1][0] as string;
      expect(dataSql).toContain("LIMIT 10 OFFSET 20");
      expect(result.total).toBe(100);
    });

    it("throws FieldError 400 for unknown field", async () => {
      const { filterWithFields } = await import("../field-query.server");
      const { FieldError } = await import("../fields.server");
      mockFieldDefFindMany.mockResolvedValue([]);

      await expect(
        filterWithFields({
          ...baseParams,
          conditions: [{ field: "nonexistent", operator: "eq", value: "test" }],
        }),
      ).rejects.toThrow(FieldError);

      await expect(
        filterWithFields({
          ...baseParams,
          conditions: [{ field: "nonexistent", operator: "eq", value: "test" }],
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws FieldError 400 for invalid field name", async () => {
      const { filterWithFields } = await import("../field-query.server");
      const { FieldError } = await import("../fields.server");
      mockFieldDefFindMany.mockResolvedValue([
        { name: "valid_field", dataType: "TEXT", isSearchable: true, isFilterable: true },
      ]);

      // The schema would catch this, but testing the service's defense-in-depth
      await expect(
        filterWithFields({
          ...baseParams,
          conditions: [{ field: "INVALID", operator: "eq", value: "test" }],
        }),
      ).rejects.toThrow(FieldError);
    });
  });

  describe("ensureFieldIndex", () => {
    it("creates index for searchable text field", async () => {
      const { ensureFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const result = await ensureFieldIndex(
        {
          id: "fd-1",
          name: "country",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: true,
          isFilterable: false,
        },
        ctx,
      );

      expect(result.action).toBe("created");
      expect(result.indexName).toBe("idx_Participant_cf_country");
      const ddl = mockExecuteRawUnsafe.mock.calls[0][0] as string;
      expect(ddl).toContain('CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Participant_cf_country"');
      expect(ddl).toContain(`("extras"->>'country')`);
      expect(ddl).toContain('WHERE "deletedAt" IS NULL');
      expect(mockAuditCreate).toHaveBeenCalled();
    });

    it("creates index with NUMERIC cast for number fields", async () => {
      const { ensureFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const result = await ensureFieldIndex(
        {
          name: "age",
          entityType: "Participant",
          dataType: "NUMBER",
          isSearchable: true,
          isFilterable: true,
        },
        ctx,
      );

      expect(result.action).toBe("created");
      const ddl = mockExecuteRawUnsafe.mock.calls[0][0] as string;
      expect(ddl).toContain(`(("extras"->>'age')::NUMERIC)`);
    });

    it("creates index with BOOLEAN cast for boolean fields", async () => {
      const { ensureFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const result = await ensureFieldIndex(
        {
          name: "is_vip",
          entityType: "Participant",
          dataType: "BOOLEAN",
          isSearchable: false,
          isFilterable: true,
        },
        ctx,
      );

      expect(result.action).toBe("created");
      const ddl = mockExecuteRawUnsafe.mock.calls[0][0] as string;
      expect(ddl).toContain(`(("extras"->>'is_vip')::BOOLEAN)`);
    });

    it("skips non-searchable and non-filterable fields", async () => {
      const { ensureFieldIndex } = await import("../field-query.server");

      const result = await ensureFieldIndex(
        {
          name: "internal",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: false,
          isFilterable: false,
        },
        ctx,
      );

      expect(result.action).toBe("skipped");
      expect(mockExecuteRawUnsafe).not.toHaveBeenCalled();
    });

    it("handles errors gracefully without throwing", async () => {
      const { ensureFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockRejectedValue(new Error("DB error"));

      const result = await ensureFieldIndex(
        {
          name: "bad_field",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: true,
          isFilterable: false,
        },
        ctx,
      );

      expect(result.action).toBe("error");
      expect(result.indexName).toBe("idx_Participant_cf_bad_field");
    });
  });

  describe("dropFieldIndex", () => {
    it("drops an existing index", async () => {
      const { dropFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const result = await dropFieldIndex(
        {
          id: "fd-1",
          name: "country",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: false,
          isFilterable: false,
        },
        ctx,
      );

      expect(result.action).toBe("dropped");
      expect(result.indexName).toBe("idx_Participant_cf_country");
      const ddl = mockExecuteRawUnsafe.mock.calls[0][0] as string;
      expect(ddl).toContain('DROP INDEX CONCURRENTLY IF EXISTS "idx_Participant_cf_country"');
      expect(mockAuditCreate).toHaveBeenCalled();
    });

    it("handles errors gracefully without throwing", async () => {
      const { dropFieldIndex } = await import("../field-query.server");
      mockExecuteRawUnsafe.mockRejectedValue(new Error("DB error"));

      const result = await dropFieldIndex(
        {
          name: "bad_field",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: false,
          isFilterable: false,
        },
        ctx,
      );

      expect(result.action).toBe("error");
    });
  });

  describe("reconcileFieldIndexes", () => {
    it("creates missing indexes and drops orphaned ones", async () => {
      const { reconcileFieldIndexes } = await import("../field-query.server");

      // Field definitions: one searchable, one not
      mockFieldDefFindMany.mockResolvedValue([
        {
          name: "country",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: true,
          isFilterable: false,
        },
        {
          name: "notes",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: false,
          isFilterable: false,
        },
      ]);

      // Existing indexes: one orphaned
      mockQueryRawUnsafe.mockResolvedValue([{ indexname: "idx_Participant_cf_old_field" }]);

      mockExecuteRawUnsafe.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const result = await reconcileFieldIndexes("tenant-1", ctx);

      expect(result.created).toContain("idx_Participant_cf_country");
      expect(result.dropped).toContain("idx_Participant_cf_old_field");
      expect(result.unchanged).toEqual([]);
    });

    it("reports unchanged indexes", async () => {
      const { reconcileFieldIndexes } = await import("../field-query.server");

      mockFieldDefFindMany.mockResolvedValue([
        {
          name: "country",
          entityType: "Participant",
          dataType: "TEXT",
          isSearchable: true,
          isFilterable: false,
        },
      ]);

      mockQueryRawUnsafe.mockResolvedValue([{ indexname: "idx_Participant_cf_country" }]);

      const result = await reconcileFieldIndexes("tenant-1", ctx);

      expect(result.created).toEqual([]);
      expect(result.dropped).toEqual([]);
      expect(result.unchanged).toContain("idx_Participant_cf_country");
    });
  });
});
