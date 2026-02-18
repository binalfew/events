import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { levenshtein } from "~/utils/levenshtein";
import type { CreateBlacklistInput, UpdateBlacklistInput } from "~/lib/schemas/duplicate-merge";

// ─── Types ────────────────────────────────────────────────

export class BlacklistError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BlacklistError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BlacklistMatch {
  blacklistId: string;
  matchType: string;
  matchField: string;
  matchValue: string;
}

// ─── Screening ────────────────────────────────────────────

export async function screenAgainstBlacklist(
  tenantId: string,
  participant: {
    firstName: string;
    lastName: string;
    email?: string | null;
    extras?: Record<string, unknown>;
  },
): Promise<BlacklistMatch[]> {
  const entries = await prisma.blacklist.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ tenantId }, { tenantId: null }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    },
  });

  const activeEntries = entries;

  const matches: BlacklistMatch[] = [];
  const passport = String(participant.extras?.passportNumber ?? "").trim();
  const email = participant.email?.toLowerCase() ?? "";
  const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();

  for (const entry of activeEntries) {
    // Exact passport match
    if (
      entry.passportNumber &&
      passport &&
      entry.passportNumber.toLowerCase() === passport.toLowerCase()
    ) {
      matches.push({
        blacklistId: entry.id,
        matchType: "exact",
        matchField: "passportNumber",
        matchValue: entry.passportNumber,
      });
    }

    // Exact email match
    if (entry.email && email && entry.email.toLowerCase() === email) {
      matches.push({
        blacklistId: entry.id,
        matchType: "exact",
        matchField: "email",
        matchValue: entry.email,
      });
    }

    // Fuzzy name match against nameVariations
    if (entry.nameVariations.length > 0) {
      for (const variation of entry.nameVariations) {
        const dist = levenshtein(fullName, variation.toLowerCase());
        if (dist <= 2) {
          matches.push({
            blacklistId: entry.id,
            matchType: dist === 0 ? "exact" : "fuzzy",
            matchField: "name",
            matchValue: variation,
          });
          break; // One match per entry is sufficient
        }
      }
    }

    // Exact name match against entry.name
    if (entry.name) {
      const dist = levenshtein(fullName, entry.name.toLowerCase());
      if (dist <= 2) {
        const alreadyMatched = matches.some(
          (m) => m.blacklistId === entry.id && m.matchField === "name",
        );
        if (!alreadyMatched) {
          matches.push({
            blacklistId: entry.id,
            matchType: dist === 0 ? "exact" : "fuzzy",
            matchField: "name",
            matchValue: entry.name,
          });
        }
      }
    }
  }

  return matches;
}

// ─── CRUD ─────────────────────────────────────────────────

export async function createBlacklistEntry(input: CreateBlacklistInput, ctx: ServiceContext) {
  const nameVariations = input.nameVariations
    ? input.nameVariations
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

  const entry = await prisma.blacklist.create({
    data: {
      tenantId: ctx.tenantId,
      type: input.type,
      name: input.name,
      nameVariations,
      passportNumber: input.passportNumber,
      email: input.email,
      reason: input.reason,
      source: input.source,
      expiresAt: input.expiresAt,
      addedBy: ctx.userId,
    },
  });

  logger.info({ blacklistId: entry.id }, "Blacklist entry created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Blacklist",
      entityId: entry.id,
      description: `Added blacklist entry: ${input.name ?? input.passportNumber ?? input.email ?? "unnamed"}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { type: input.type, reason: input.reason },
    },
  });

  return entry;
}

export async function listBlacklistEntries(
  tenantId: string,
  filters: { isActive?: boolean; page?: number; pageSize?: number },
) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  const where = {
    tenantId,
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.blacklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blacklist.count({ where }),
  ]);

  return { entries, total, page, pageSize };
}

export async function getBlacklistEntry(id: string, tenantId: string) {
  const entry = await prisma.blacklist.findFirst({
    where: { id, tenantId },
  });
  if (!entry) {
    throw new BlacklistError("Blacklist entry not found", 404);
  }
  return entry;
}

export async function updateBlacklistEntry(
  id: string,
  input: UpdateBlacklistInput,
  ctx: ServiceContext,
) {
  const existing = await prisma.blacklist.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new BlacklistError("Blacklist entry not found", 404);
  }

  const data: Record<string, unknown> = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.name !== undefined) data.name = input.name;
  if (input.nameVariations !== undefined) {
    data.nameVariations = input.nameVariations
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (input.passportNumber !== undefined) data.passportNumber = input.passportNumber;
  if (input.email !== undefined) data.email = input.email;
  if (input.reason !== undefined) data.reason = input.reason;
  if (input.source !== undefined) data.source = input.source;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;

  const entry = await prisma.blacklist.update({
    where: { id },
    data: data as any,
  });

  logger.info({ blacklistId: id }, "Blacklist entry updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "Blacklist",
      entityId: id,
      description: `Updated blacklist entry "${existing.name ?? id}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return entry;
}

export async function deactivateBlacklistEntry(id: string, ctx: ServiceContext) {
  const existing = await prisma.blacklist.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new BlacklistError("Blacklist entry not found", 404);
  }

  const entry = await prisma.blacklist.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info({ blacklistId: id }, "Blacklist entry deactivated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "Blacklist",
      entityId: id,
      description: `Deactivated blacklist entry "${existing.name ?? id}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return entry;
}

export async function deleteBlacklistEntry(id: string, ctx: ServiceContext) {
  const existing = await prisma.blacklist.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new BlacklistError("Blacklist entry not found", 404);
  }

  await prisma.blacklist.delete({ where: { id } });

  logger.info({ blacklistId: id }, "Blacklist entry deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Blacklist",
      entityId: id,
      description: `Deleted blacklist entry "${existing.name ?? id}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });
}
