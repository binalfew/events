import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockDuplicateCandidateUpsert = vi.fn();
const mockDuplicateCandidateUpdateMany = vi.fn();
const mockDuplicateCandidateFindFirst = vi.fn();
const mockDuplicateCandidateUpdate = vi.fn();
const mockDuplicateCandidateFindMany = vi.fn();
const mockDuplicateCandidateCount = vi.fn();
const mockEventFindFirst = vi.fn();
const mockEventFindMany = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockParticipantUpdate = vi.fn();
const mockApprovalUpdateMany = vi.fn();
const mockAccessLogUpdateMany = vi.fn();
const mockQueueTicketUpdateMany = vi.fn();
const mockMessageDeliveryUpdateMany = vi.fn();
const mockMergeHistoryCreate = vi.fn();
const mockMergeHistoryFindMany = vi.fn();
const mockMergeHistoryCount = vi.fn();
const mockAuditLogCreate = vi.fn();
const mockBlacklistFindMany = vi.fn();
const mockBlacklistCreate = vi.fn();
const mockBlacklistFindFirst = vi.fn();
const mockBlacklistUpdate = vi.fn();
const mockBlacklistDelete = vi.fn();
const mockBlacklistCount = vi.fn();
const mockTransaction = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    duplicateCandidate: {
      upsert: (...args: unknown[]) => mockDuplicateCandidateUpsert(...args),
      updateMany: (...args: unknown[]) => mockDuplicateCandidateUpdateMany(...args),
      findFirst: (...args: unknown[]) => mockDuplicateCandidateFindFirst(...args),
      update: (...args: unknown[]) => mockDuplicateCandidateUpdate(...args),
      findMany: (...args: unknown[]) => mockDuplicateCandidateFindMany(...args),
      count: (...args: unknown[]) => mockDuplicateCandidateCount(...args),
    },
    event: {
      findFirst: (...args: unknown[]) => mockEventFindFirst(...args),
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
    },
    participant: {
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
      update: (...args: unknown[]) => mockParticipantUpdate(...args),
    },
    approval: {
      updateMany: (...args: unknown[]) => mockApprovalUpdateMany(...args),
    },
    accessLog: {
      updateMany: (...args: unknown[]) => mockAccessLogUpdateMany(...args),
    },
    queueTicket: {
      updateMany: (...args: unknown[]) => mockQueueTicketUpdateMany(...args),
    },
    messageDelivery: {
      updateMany: (...args: unknown[]) => mockMessageDeliveryUpdateMany(...args),
    },
    mergeHistory: {
      create: (...args: unknown[]) => mockMergeHistoryCreate(...args),
      findMany: (...args: unknown[]) => mockMergeHistoryFindMany(...args),
      count: (...args: unknown[]) => mockMergeHistoryCount(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
    blacklist: {
      findMany: (...args: unknown[]) => mockBlacklistFindMany(...args),
      create: (...args: unknown[]) => mockBlacklistCreate(...args),
      findFirst: (...args: unknown[]) => mockBlacklistFindFirst(...args),
      update: (...args: unknown[]) => mockBlacklistUpdate(...args),
      delete: (...args: unknown[]) => mockBlacklistDelete(...args),
      count: (...args: unknown[]) => mockBlacklistCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
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

function makeSnapshot(overrides = {}): any {
  return {
    id: "part-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    eventId: "event-1",
    extras: {},
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────

describe("duplicate-detection.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("scoreParticipantPair", () => {
    it("returns 1.0 for exact passport match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({ extras: { passportNumber: "AB123456" } });
      const b = makeSnapshot({ id: "part-2", extras: { passportNumber: "AB123456" } });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(1.0);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "passportNumber", score: 1.0, matchType: "exact" }),
        ]),
      );
    });

    it("returns 0.95 for exact email match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({ email: "same@test.com", firstName: "Alice", lastName: "Wonder" });
      const b = makeSnapshot({
        id: "part-2",
        email: "Same@Test.com",
        firstName: "Bob",
        lastName: "Builder",
      });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0.95);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "email", score: 0.95 })]),
      );
    });

    it("returns 0.90 for normalized phone match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({
        firstName: "Alice",
        lastName: "Wonder",
        email: null,
        extras: { phone: "+1 (555) 123-4567" },
      });
      const b = makeSnapshot({
        id: "part-2",
        firstName: "Bob",
        lastName: "Builder",
        email: null,
        extras: { phone: "15551234567" },
      });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0.9);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "phone", score: 0.9 })]),
      );
    });

    it("returns 0.85 for name Levenshtein ≤2", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({ firstName: "John", lastName: "Doe", email: null });
      const b = makeSnapshot({ id: "part-2", firstName: "Jon", lastName: "Doe", email: null });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0.85);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "name", matchType: "levenshtein" }),
        ]),
      );
    });

    it("returns 0.80 for name Soundex match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      // Names where Levenshtein > 2 but Soundex matches
      // "Robert" → R163, "Rupert" → R163, "Smith" → S530, "Smithe" → S530
      // "robert smith" vs "rupert smithe" → Levenshtein = 4 but same Soundex codes
      const a = makeSnapshot({ firstName: "Robert", lastName: "Smith", email: null });
      const b = makeSnapshot({
        id: "part-2",
        firstName: "Rupert",
        lastName: "Smithe",
        email: null,
      });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0.8);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name", matchType: "soundex" })]),
      );
    });

    it("returns 0.90 for name + DOB match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({
        firstName: "Jon",
        lastName: "Doe",
        email: null,
        extras: { dateOfBirth: "1990-01-01" },
      });
      const b = makeSnapshot({
        id: "part-2",
        firstName: "John",
        lastName: "Doe",
        email: null,
        extras: { dateOfBirth: "1990-01-01" },
      });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0.9);
      expect(result.matchFields).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name+dateOfBirth" })]),
      );
    });

    it("caps cross-field boost at 1.0", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({
        email: "same@test.com",
        extras: { passportNumber: "AB123", phone: "+1234" },
      });
      const b = makeSnapshot({
        id: "part-2",
        email: "same@test.com",
        extras: { passportNumber: "AB123", phone: "1234" },
      });

      const result = scoreParticipantPair(a, b);

      // passport=1.0, email=0.95, phone=0.90, name=0.85 → base=1.0 + boost capped
      expect(result.score).toBe(1.0);
    });

    it("returns 0 when no fields match", async () => {
      const { scoreParticipantPair } = await import("../duplicate-detection.server");

      const a = makeSnapshot({
        firstName: "Alice",
        lastName: "Wonder",
        email: "alice@test.com",
      });
      const b = makeSnapshot({
        id: "part-2",
        firstName: "Zephyr",
        lastName: "Quantum",
        email: "zephyr@other.com",
      });

      const result = scoreParticipantPair(a, b);

      expect(result.score).toBe(0);
      expect(result.matchFields).toHaveLength(0);
    });
  });

  describe("classifyScore", () => {
    it("returns BLOCK for score ≥ 0.90", async () => {
      const { classifyScore } = await import("../duplicate-detection.server");
      expect(classifyScore(0.9)).toBe("BLOCK");
      expect(classifyScore(1.0)).toBe("BLOCK");
    });

    it("returns WARN for score 0.75", async () => {
      const { classifyScore } = await import("../duplicate-detection.server");
      expect(classifyScore(0.75)).toBe("WARN");
    });

    it("returns PASS for score 0.50", async () => {
      const { classifyScore } = await import("../duplicate-detection.server");
      expect(classifyScore(0.5)).toBe("PASS");
    });
  });
});

describe("blacklist.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("screenAgainstBlacklist", () => {
    it("detects exact passport match", async () => {
      const { screenAgainstBlacklist } = await import("../blacklist.server");

      mockBlacklistFindMany.mockResolvedValue([
        {
          id: "bl-1",
          tenantId: "tenant-1",
          isActive: true,
          expiresAt: null,
          passportNumber: "AB123456",
          email: null,
          name: null,
          nameVariations: [],
        },
      ]);

      const result = await screenAgainstBlacklist("tenant-1", {
        firstName: "John",
        lastName: "Doe",
        email: null,
        extras: { passportNumber: "AB123456" },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({ matchField: "passportNumber", matchType: "exact" }),
      );
    });

    it("detects fuzzy name match in nameVariations", async () => {
      const { screenAgainstBlacklist } = await import("../blacklist.server");

      mockBlacklistFindMany.mockResolvedValue([
        {
          id: "bl-1",
          tenantId: "tenant-1",
          isActive: true,
          expiresAt: null,
          passportNumber: null,
          email: null,
          name: null,
          nameVariations: ["jon doe", "john d"],
        },
      ]);

      const result = await screenAgainstBlacklist("tenant-1", {
        firstName: "John",
        lastName: "Doe",
        extras: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ matchField: "name" }));
    });

    it("skips expired blacklist entries", async () => {
      const { screenAgainstBlacklist } = await import("../blacklist.server");

      mockBlacklistFindMany.mockResolvedValue([]);

      const result = await screenAgainstBlacklist("tenant-1", {
        firstName: "John",
        lastName: "Doe",
        extras: { passportNumber: "AB123456" },
      });

      expect(result).toHaveLength(0);
    });
  });
});

describe("participant-merge.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("mergeParticipants", () => {
    it("migrates approvals and soft-deletes merged participant", async () => {
      const { mergeParticipants } = await import("../participant-merge.server");

      const survivingParticipant = {
        id: "part-1",
        tenantId: "tenant-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        organization: "Org A",
        jobTitle: null,
        nationality: null,
        extras: {},
        deletedAt: null,
      };

      const mergedParticipant = {
        id: "part-2",
        tenantId: "tenant-1",
        firstName: "Jon",
        lastName: "Doe",
        email: "jon@test.com",
        organization: "Org B",
        jobTitle: "Manager",
        nationality: null,
        extras: {},
        deletedAt: null,
      };

      // Mock transaction to execute the callback
      mockTransaction.mockImplementation(async (cb: any) => {
        return cb({
          participant: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce(survivingParticipant)
              .mockResolvedValueOnce(mergedParticipant),
            update: vi.fn().mockResolvedValue({}),
          },
          approval: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
          accessLog: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          queueTicket: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
          messageDelivery: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
          duplicateCandidate: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          mergeHistory: {
            create: vi.fn().mockResolvedValue({
              id: "mh-1",
              survivingId: "part-1",
              mergedId: "part-2",
              approvalsMigrated: 4,
            }),
          },
          auditLog: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await mergeParticipants(
        {
          survivingId: "part-1",
          mergedId: "part-2",
          fieldResolution: { firstName: "surviving", organization: "merged" },
        },
        CTX,
      );

      expect(result.survivingId).toBe("part-1");
      expect(result.mergedId).toBe("part-2");
      expect(mockTransaction).toHaveBeenCalled();
    });
  });
});

describe("levenshtein utilities", () => {
  it("levenshtein returns correct distance", async () => {
    const { levenshtein } = await import("../../utils/levenshtein");
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("john", "jon")).toBe(1);
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("soundex produces correct codes", async () => {
    const { soundex } = await import("../../utils/levenshtein");
    expect(soundex("Robert")).toBe("R163");
    expect(soundex("Smith")).toBe("S530");
    expect(soundex("")).toBe("");
  });

  it("normalizePhone strips non-digits", async () => {
    const { normalizePhone } = await import("../../utils/levenshtein");
    expect(normalizePhone("+1 (555) 123-4567")).toBe("15551234567");
    expect(normalizePhone("123")).toBe("123");
  });
});
