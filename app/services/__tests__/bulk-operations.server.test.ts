import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockOperationCreate = vi.fn();
const mockOperationFindFirst = vi.fn();
const mockOperationFindUnique = vi.fn();
const mockOperationFindMany = vi.fn();
const mockOperationUpdate = vi.fn();
const mockOperationDelete = vi.fn();
const mockOperationCount = vi.fn();

const mockItemCreate = vi.fn();
const mockItemCreateMany = vi.fn();
const mockItemFindMany = vi.fn();
const mockItemUpdate = vi.fn();
const mockItemDeleteMany = vi.fn();
const mockItemCount = vi.fn();

const mockParticipantCreate = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockParticipantDelete = vi.fn();
const mockParticipantUpdate = vi.fn();

const mockFieldDefFindMany = vi.fn();
const mockParticipantTypeFindFirst = vi.fn();
const mockWorkflowFindFirst = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    bulkOperation: {
      create: (...args: unknown[]) => mockOperationCreate(...args),
      findFirst: (...args: unknown[]) => mockOperationFindFirst(...args),
      findUnique: (...args: unknown[]) => mockOperationFindUnique(...args),
      findMany: (...args: unknown[]) => mockOperationFindMany(...args),
      update: (...args: unknown[]) => mockOperationUpdate(...args),
      delete: (...args: unknown[]) => mockOperationDelete(...args),
      count: (...args: unknown[]) => mockOperationCount(...args),
    },
    bulkOperationItem: {
      create: (...args: unknown[]) => mockItemCreate(...args),
      createMany: (...args: unknown[]) => mockItemCreateMany(...args),
      findMany: (...args: unknown[]) => mockItemFindMany(...args),
      update: (...args: unknown[]) => mockItemUpdate(...args),
      deleteMany: (...args: unknown[]) => mockItemDeleteMany(...args),
      count: (...args: unknown[]) => mockItemCount(...args),
    },
    participant: {
      create: (...args: unknown[]) => mockParticipantCreate(...args),
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
      delete: (...args: unknown[]) => mockParticipantDelete(...args),
      update: (...args: unknown[]) => mockParticipantUpdate(...args),
    },
    fieldDefinition: {
      findMany: (...args: unknown[]) => mockFieldDefFindMany(...args),
    },
    participantType: {
      findFirst: (...args: unknown[]) => mockParticipantTypeFindFirst(...args),
    },
    workflow: {
      findFirst: (...args: unknown[]) => mockWorkflowFindFirst(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/lib/feature-flags.server", () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(true),
  FEATURE_FLAG_KEYS: { BULK_OPERATIONS: "FF_BULK_OPERATIONS" },
}));

// ─── Import parser directly (not mocked) ────────────────

import { parseImportFile } from "~/services/bulk-import/parser.server";
import {
  suggestColumnMappings,
  applyMappings,
  FIXED_PARTICIPANT_FIELDS,
} from "~/services/bulk-import/column-mapper.server";
import { validateImportRows } from "~/services/bulk-import/validator.server";
import { captureSnapshot, restoreFromSnapshot } from "~/services/bulk-import/undo.server";
import { exportParticipants } from "~/services/bulk-export.server";
import {
  createBulkOperation,
  listOperations,
  BulkOperationError,
} from "~/services/bulk-operations.server";

// ─── Reset ───────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────

describe("CSV Parser", () => {
  it("parses comma-delimited CSV", async () => {
    const csv =
      "First Name,Last Name,Email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com";
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseImportFile(buffer, "text/csv");

    expect(result.headers).toEqual(["First Name", "Last Name", "Email"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["First Name"]).toBe("John");
    expect(result.rows[0]["Email"]).toBe("john@example.com");
    expect(result.delimiter).toBe(",");
  });

  it("auto-detects semicolon delimiter", async () => {
    const csv = "Name;Email;Country\nAlice;alice@test.com;USA\nBob;bob@test.com;UK";
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseImportFile(buffer, "text/csv");

    expect(result.delimiter).toBe(";");
    expect(result.headers).toEqual(["Name", "Email", "Country"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["Name"]).toBe("Alice");
  });

  it("handles quoted fields with escaped quotes", async () => {
    const csv = 'Name,Title\n"John ""JD"" Doe","Senior ""Dev"""\n"Jane","Manager"';
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseImportFile(buffer, "text/csv");

    expect(result.rows[0]["Name"]).toBe('John "JD" Doe');
    expect(result.rows[0]["Title"]).toBe('Senior "Dev"');
  });

  it("strips UTF-8 BOM", async () => {
    const csv = "\uFEFFFirstName,LastName\nJohn,Doe";
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseImportFile(buffer, "text/csv");

    expect(result.headers).toEqual(["FirstName", "LastName"]);
    expect(result.rows).toHaveLength(1);
  });
});

describe("XLSX Parser", () => {
  it("parses basic XLSX sheet", async () => {
    // Create a minimal XLSX buffer using the xlsx library
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["firstName", "lastName", "email"],
      ["Alice", "Wonder", "alice@test.com"],
      ["Bob", "Builder", "bob@test.com"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

    const result = await parseImportFile(
      buffer,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    expect(result.headers).toEqual(["firstName", "lastName", "email"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["firstName"]).toBe("Alice");
  });
});

describe("Column Mapper", () => {
  it("suggests exact match mappings", () => {
    const headers = ["firstName", "lastName", "email"];
    const mappings = suggestColumnMappings(headers, FIXED_PARTICIPANT_FIELDS);

    expect(mappings).toContainEqual({ sourceColumn: "firstName", targetField: "firstName" });
    expect(mappings).toContainEqual({ sourceColumn: "lastName", targetField: "lastName" });
    expect(mappings).toContainEqual({ sourceColumn: "email", targetField: "email" });
  });

  it("matches common aliases", () => {
    const headers = ["First Name", "Surname", "Email Address"];
    const mappings = suggestColumnMappings(headers, FIXED_PARTICIPANT_FIELDS);

    expect(mappings).toContainEqual({ sourceColumn: "First Name", targetField: "firstName" });
    expect(mappings).toContainEqual({ sourceColumn: "Surname", targetField: "lastName" });
    expect(mappings).toContainEqual({ sourceColumn: "Email Address", targetField: "email" });
  });

  it("applies transforms correctly", () => {
    const rows = [{ name: "  john  ", title: "dev" }];
    const mappings = [
      { sourceColumn: "name", targetField: "firstName", transform: "trim" as const },
      { sourceColumn: "title", targetField: "jobTitle", transform: "uppercase" as const },
    ];

    const result = applyMappings(rows, mappings);
    expect(result[0]["firstName"]).toBe("john");
    expect(result[0]["jobTitle"]).toBe("DEV");
  });
});

describe("Row Validator", () => {
  it("catches missing required fields", async () => {
    mockParticipantFindMany.mockResolvedValue([]);

    const rows = [
      { firstName: "", lastName: "Doe", email: "test@test.com" },
      { firstName: "Jane", lastName: "", email: "jane@test.com" },
    ];

    const results = await validateImportRows(rows, "event-1", "tenant-1");

    expect(results[0].status).toBe("error");
    expect(results[0].errors).toContainEqual({
      field: "firstName",
      message: "First name is required",
    });
    expect(results[1].status).toBe("error");
    expect(results[1].errors).toContainEqual({
      field: "lastName",
      message: "Last name is required",
    });
  });

  it("detects duplicate emails within file", async () => {
    mockParticipantFindMany.mockResolvedValue([]);

    const rows = [
      { firstName: "John", lastName: "Doe", email: "same@test.com" },
      { firstName: "Jane", lastName: "Smith", email: "same@test.com" },
    ];

    const results = await validateImportRows(rows, "event-1", "tenant-1");

    expect(results[0].status).toBe("valid");
    expect(results[1].status).toBe("warning");
    expect(results[1].warnings[0].message).toContain("Duplicate email");
  });

  it("validates email format", async () => {
    mockParticipantFindMany.mockResolvedValue([]);

    const rows = [{ firstName: "John", lastName: "Doe", email: "not-an-email" }];

    const results = await validateImportRows(rows, "event-1", "tenant-1");

    expect(results[0].status).toBe("error");
    expect(results[0].errors).toContainEqual({
      field: "email",
      message: "Invalid email format",
    });
  });
});

describe("Bulk Operations Service", () => {
  it("creates an operation with audit log", async () => {
    const mockOp = {
      id: "op-1",
      tenantId: "t-1",
      eventId: "e-1",
      type: "IMPORT_PARTICIPANTS",
      status: "VALIDATING",
      description: "Test import",
      createdBy: "u-1",
    };
    mockOperationCreate.mockResolvedValue(mockOp);
    mockAuditLogCreate.mockResolvedValue({});

    const result = await createBulkOperation(
      {
        eventId: "e-1",
        type: "IMPORT_PARTICIPANTS",
        description: "Test import",
      },
      { userId: "u-1", tenantId: "t-1" },
    );

    expect(result.id).toBe("op-1");
    expect(mockOperationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "t-1",
          eventId: "e-1",
          type: "IMPORT_PARTICIPANTS",
          status: "VALIDATING",
        }),
      }),
    );
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it("lists operations with pagination", async () => {
    mockOperationFindMany.mockResolvedValue([
      { id: "op-1", type: "IMPORT_PARTICIPANTS", status: "COMPLETED" },
    ]);
    mockOperationCount.mockResolvedValue(1);

    const result = await listOperations("e-1", "t-1");

    expect(result.operations).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });
});

describe("Undo Service", () => {
  it("captures snapshot by storing participant state in items", async () => {
    mockItemFindMany.mockResolvedValue([
      { id: "item-1", participantId: "p-1" },
      { id: "item-2", participantId: "p-2" },
    ]);
    mockParticipantFindMany.mockResolvedValue([
      { id: "p-1", firstName: "John", lastName: "Doe", email: "john@test.com", status: "PENDING" },
      {
        id: "p-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
        status: "PENDING",
      },
    ]);
    mockItemUpdate.mockResolvedValue({});
    mockOperationUpdate.mockResolvedValue({});

    await captureSnapshot("op-1", ["p-1", "p-2"]);

    expect(mockItemUpdate).toHaveBeenCalledTimes(2);
    expect(mockOperationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "op-1" },
        data: expect.objectContaining({
          snapshotData: expect.objectContaining({ participantCount: 2 }),
        }),
      }),
    );
  });

  it("restores from snapshot by deleting imported participants", async () => {
    mockOperationFindUnique.mockResolvedValue({ type: "IMPORT_PARTICIPANTS" });
    mockItemFindMany.mockResolvedValue([
      { id: "item-1", participantId: "p-1", previousState: null },
      { id: "item-2", participantId: "p-2", previousState: null },
    ]);
    mockParticipantDelete.mockResolvedValue({});

    const result = await restoreFromSnapshot("op-1");

    expect(mockParticipantDelete).toHaveBeenCalledTimes(2);
    expect(result.restoredCount).toBe(2);
    expect(result.failedCount).toBe(0);
  });
});

describe("Export Service", () => {
  it("generates valid CSV with BOM", async () => {
    mockParticipantFindMany.mockResolvedValue([
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        organization: "ACME",
        jobTitle: null,
        nationality: null,
        registrationCode: "REG-001",
        status: "APPROVED",
        participantType: { name: "Delegate" },
        createdAt: new Date("2026-01-15"),
        extras: {},
      },
    ]);
    mockFieldDefFindMany.mockResolvedValue([]);

    const csv = await exportParticipants("e-1", "t-1");

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"First Name"');
    expect(csv).toContain('"John"');
    expect(csv).toContain('"Doe"');
    expect(csv).toContain('"john@test.com"');
    expect(csv).toContain('"APPROVED"');
    expect(csv).toContain('"Delegate"');
  });
});
