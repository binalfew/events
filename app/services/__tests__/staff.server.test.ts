import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockStaffCreate = vi.fn();
const mockStaffFindFirst = vi.fn();
const mockStaffFindMany = vi.fn();
const mockStaffUpdate = vi.fn();
const mockShiftCreate = vi.fn();
const mockShiftFindFirst = vi.fn();
const mockShiftFindMany = vi.fn();
const mockAssignmentCreate = vi.fn();
const mockAssignmentFindFirst = vi.fn();
const mockAssignmentFindMany = vi.fn();
const mockAssignmentUpdate = vi.fn();
const mockAssignmentDelete = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    staffMember: {
      create: (...args: unknown[]) => mockStaffCreate(...args),
      findFirst: (...args: unknown[]) => mockStaffFindFirst(...args),
      findMany: (...args: unknown[]) => mockStaffFindMany(...args),
      update: (...args: unknown[]) => mockStaffUpdate(...args),
    },
    staffShift: {
      create: (...args: unknown[]) => mockShiftCreate(...args),
      findFirst: (...args: unknown[]) => mockShiftFindFirst(...args),
      findMany: (...args: unknown[]) => mockShiftFindMany(...args),
    },
    shiftAssignment: {
      create: (...args: unknown[]) => mockAssignmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAssignmentFindFirst(...args),
      findMany: (...args: unknown[]) => mockAssignmentFindMany(...args),
      update: (...args: unknown[]) => mockAssignmentUpdate(...args),
      delete: (...args: unknown[]) => mockAssignmentDelete(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

// ─── Tests ───────────────────────────────────────────────

describe("staff.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("registerStaff", () => {
    it("creates staff member and audit log", async () => {
      const { registerStaff } = await import("../staff.server");

      mockStaffCreate.mockImplementation(async ({ data }: any) => ({
        id: "staff-1",
        ...data,
        user: { id: "user-2", name: "Jane Smith", email: "jane@test.com" },
      }));

      const result = await registerStaff(
        {
          eventId: "event-1",
          userId: "user-2",
          role: "SECURITY",
          zone: "Gate A",
          phone: "+1234567890",
        },
        CTX,
      );

      expect(result.id).toBe("staff-1");
      expect(result.role).toBe("SECURITY");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("deactivateStaff", () => {
    it("marks staff as inactive", async () => {
      const { deactivateStaff } = await import("../staff.server");

      mockStaffFindFirst.mockResolvedValue({ id: "staff-1", tenantId: "tenant-1" });
      mockStaffUpdate.mockImplementation(async ({ data }: any) => ({
        id: "staff-1",
        ...data,
      }));

      const result = await deactivateStaff("staff-1", CTX);
      expect(result.isActive).toBe(false);
    });

    it("throws when staff not found", async () => {
      const { deactivateStaff } = await import("../staff.server");
      mockStaffFindFirst.mockResolvedValue(null);

      await expect(deactivateStaff("missing", CTX)).rejects.toThrow("Staff member not found");
    });
  });

  describe("createShift", () => {
    it("creates shift and audit log", async () => {
      const { createShift } = await import("../staff.server");

      mockShiftCreate.mockImplementation(async ({ data }: any) => ({
        id: "shift-1",
        ...data,
      }));

      const result = await createShift(
        {
          eventId: "event-1",
          name: "Morning Security",
          date: "2026-03-01",
          startTime: "2026-03-01T08:00:00.000Z",
          endTime: "2026-03-01T16:00:00.000Z",
          zone: "Main Gate",
          requiredRole: "SECURITY",
          capacity: 5,
        },
        CTX,
      );

      expect(result.id).toBe("shift-1");
      expect(result.name).toBe("Morning Security");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("assignToShift", () => {
    it("assigns staff to shift", async () => {
      const { assignToShift } = await import("../staff.server");

      mockStaffFindFirst.mockResolvedValue({
        id: "staff-1",
        tenantId: "tenant-1",
        role: "SECURITY",
        isActive: true,
      });
      mockShiftFindFirst.mockResolvedValue({
        id: "shift-1",
        tenantId: "tenant-1",
        requiredRole: "SECURITY",
        capacity: 5,
        _count: { assignments: 2 },
      });
      mockAssignmentCreate.mockImplementation(async ({ data }: any) => ({
        id: "assign-1",
        ...data,
        staffMember: { user: { id: "user-2", name: "Jane" } },
        shift: { id: "shift-1", name: "Morning" },
      }));

      const result = await assignToShift("staff-1", "shift-1", CTX);
      expect(result.id).toBe("assign-1");
    });

    it("throws when shift is full", async () => {
      const { assignToShift } = await import("../staff.server");

      mockStaffFindFirst.mockResolvedValue({
        id: "staff-1",
        tenantId: "tenant-1",
        role: "SECURITY",
        isActive: true,
      });
      mockShiftFindFirst.mockResolvedValue({
        id: "shift-1",
        tenantId: "tenant-1",
        requiredRole: "SECURITY",
        capacity: 2,
        _count: { assignments: 2 },
      });

      await expect(assignToShift("staff-1", "shift-1", CTX)).rejects.toThrow("full capacity");
    });

    it("throws when role doesn't match", async () => {
      const { assignToShift } = await import("../staff.server");

      mockStaffFindFirst.mockResolvedValue({
        id: "staff-1",
        tenantId: "tenant-1",
        role: "USHER",
        isActive: true,
      });
      mockShiftFindFirst.mockResolvedValue({
        id: "shift-1",
        tenantId: "tenant-1",
        requiredRole: "SECURITY",
        capacity: 5,
        _count: { assignments: 0 },
      });

      await expect(assignToShift("staff-1", "shift-1", CTX)).rejects.toThrow("requires role");
    });
  });

  describe("checkInStaff", () => {
    it("transitions SCHEDULED to CHECKED_IN", async () => {
      const { checkInStaff } = await import("../staff.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        status: "SCHEDULED",
      });
      mockAssignmentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "assign-1",
        ...data,
      }));

      const result = await checkInStaff("staff-1", "shift-1", CTX);
      expect(result.status).toBe("CHECKED_IN");
      expect(result.checkedInAt).toBeInstanceOf(Date);
    });

    it("throws on invalid status transition", async () => {
      const { checkInStaff } = await import("../staff.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        status: "CHECKED_OUT",
      });

      await expect(checkInStaff("staff-1", "shift-1", CTX)).rejects.toThrow("Cannot check in");
    });
  });

  describe("checkOutStaff", () => {
    it("transitions CHECKED_IN to CHECKED_OUT", async () => {
      const { checkOutStaff } = await import("../staff.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        status: "CHECKED_IN",
      });
      mockAssignmentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "assign-1",
        ...data,
      }));

      const result = await checkOutStaff("staff-1", "shift-1", CTX);
      expect(result.status).toBe("CHECKED_OUT");
      expect(result.checkedOutAt).toBeInstanceOf(Date);
    });

    it("throws when not CHECKED_IN", async () => {
      const { checkOutStaff } = await import("../staff.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        status: "SCHEDULED",
      });

      await expect(checkOutStaff("staff-1", "shift-1", CTX)).rejects.toThrow("Cannot check out");
    });
  });

  describe("getStaffDashboard", () => {
    it("returns correct counts", async () => {
      const { getStaffDashboard } = await import("../staff.server");

      mockStaffFindMany.mockResolvedValue([
        { role: "SECURITY", isActive: true },
        { role: "SECURITY", isActive: true },
        { role: "USHER", isActive: false },
      ]);
      mockAssignmentFindMany.mockResolvedValue([
        { status: "SCHEDULED" },
        { status: "CHECKED_IN" },
        { status: "CHECKED_IN" },
        { status: "NO_SHOW" },
      ]);

      const result = await getStaffDashboard("event-1", "tenant-1");
      expect(result.totalStaff).toBe(3);
      expect(result.activeStaff).toBe(2);
      expect(result.byRole["SECURITY"]).toBe(2);
      expect(result.checkedIn).toBe(2);
      expect(result.noShows).toBe(1);
    });
  });

  describe("autoAssignShifts", () => {
    it("assigns unassigned staff to shifts by role", async () => {
      const { autoAssignShifts } = await import("../staff.server");

      mockShiftFindMany.mockResolvedValue([
        {
          id: "shift-1",
          requiredRole: "SECURITY",
          capacity: 3,
          _count: { assignments: 1 },
        },
      ]);
      mockStaffFindMany.mockResolvedValue([
        { id: "staff-1", role: "SECURITY", assignments: [] },
        { id: "staff-2", role: "SECURITY", assignments: [{ shiftId: "shift-1" }] },
        { id: "staff-3", role: "USHER", assignments: [] },
      ]);
      mockAssignmentCreate.mockResolvedValue({});

      const result = await autoAssignShifts("event-1", "tenant-1", CTX);
      // staff-1 eligible (SECURITY, not assigned), staff-2 already assigned, staff-3 wrong role
      expect(result.assigned).toBe(1);
      expect(mockAssignmentCreate).toHaveBeenCalledTimes(1);
    });
  });
});
