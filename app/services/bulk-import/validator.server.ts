import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

// ─── Types ───────────────────────────────────────────────

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface RowValidationResult {
  rowNumber: number;
  status: "valid" | "warning" | "error";
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ─── Email regex ─────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validate import rows ────────────────────────────────

export async function validateImportRows(
  rows: Record<string, unknown>[],
  eventId: string,
  tenantId: string,
): Promise<RowValidationResult[]> {
  const results: RowValidationResult[] = [];
  const seenEmails = new Map<string, number>(); // email -> first row
  const seenCodes = new Map<string, number>(); // code -> first row

  // Batch-load existing emails and codes for DB duplicate detection
  const emails = rows
    .map((r) =>
      String(r.email ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
  const codes = rows.map((r) => String(r.registrationCode ?? "").trim()).filter(Boolean);

  let existingEmails = new Set<string>();
  let existingCodes = new Set<string>();

  try {
    if (emails.length > 0) {
      const dbParticipants = await prisma.participant.findMany({
        where: {
          tenantId,
          eventId,
          email: { in: emails },
          deletedAt: null,
        },
        select: { email: true },
      });
      existingEmails = new Set(
        dbParticipants.map((p) => p.email?.toLowerCase()).filter(Boolean) as string[],
      );
    }

    if (codes.length > 0) {
      const dbParticipants = await prisma.participant.findMany({
        where: {
          tenantId,
          eventId,
          registrationCode: { in: codes },
          deletedAt: null,
        },
        select: { registrationCode: true },
      });
      existingCodes = new Set(dbParticipants.map((p) => p.registrationCode));
    }
  } catch (error) {
    logger.error({ error }, "Error loading existing participants for duplicate check");
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Required fields
    const firstName = String(row.firstName ?? "").trim();
    const lastName = String(row.lastName ?? "").trim();

    if (!firstName) {
      errors.push({ field: "firstName", message: "First name is required" });
    }
    if (!lastName) {
      errors.push({ field: "lastName", message: "Last name is required" });
    }

    // Email validation
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    if (email && !EMAIL_REGEX.test(email)) {
      errors.push({ field: "email", message: "Invalid email format" });
    }

    // Intra-file duplicate detection: email
    if (email) {
      const prevRow = seenEmails.get(email);
      if (prevRow !== undefined) {
        warnings.push({
          field: "email",
          message: `Duplicate email — same as row ${prevRow}`,
        });
      } else {
        seenEmails.set(email, rowNumber);
      }

      // DB duplicate
      if (existingEmails.has(email)) {
        warnings.push({
          field: "email",
          message: "Email already exists in this event",
        });
      }
    }

    // Intra-file duplicate detection: registrationCode
    const regCode = String(row.registrationCode ?? "").trim();
    if (regCode) {
      const prevRow = seenCodes.get(regCode);
      if (prevRow !== undefined) {
        errors.push({
          field: "registrationCode",
          message: `Duplicate registration code — same as row ${prevRow}`,
        });
      } else {
        seenCodes.set(regCode, rowNumber);
      }

      // DB duplicate
      if (existingCodes.has(regCode)) {
        errors.push({
          field: "registrationCode",
          message: "Registration code already exists in this event",
        });
      }
    }

    const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";
    results.push({ rowNumber, status, errors, warnings });
  }

  logger.info(
    {
      totalRows: rows.length,
      valid: results.filter((r) => r.status === "valid").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error").length,
    },
    "Import validation complete",
  );

  return results;
}
