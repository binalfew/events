import type { ColumnMapping } from "~/lib/schemas/bulk-operation";

// ─── Types ───────────────────────────────────────────────

export interface FieldInfo {
  name: string;
  label: string;
  isRequired: boolean;
}

// ─── Fixed participant fields ────────────────────────────

export const FIXED_PARTICIPANT_FIELDS: FieldInfo[] = [
  { name: "firstName", label: "First Name", isRequired: true },
  { name: "lastName", label: "Last Name", isRequired: true },
  { name: "email", label: "Email", isRequired: false },
  { name: "organization", label: "Organization", isRequired: false },
  { name: "jobTitle", label: "Job Title", isRequired: false },
  { name: "nationality", label: "Nationality", isRequired: false },
  { name: "registrationCode", label: "Registration Code", isRequired: false },
];

// ─── Common aliases ──────────────────────────────────────

const ALIASES: Record<string, string> = {
  "first name": "firstName",
  first_name: "firstName",
  firstname: "firstName",
  "given name": "firstName",
  prenom: "firstName",
  "last name": "lastName",
  last_name: "lastName",
  lastname: "lastName",
  "family name": "lastName",
  surname: "lastName",
  nom: "lastName",
  "email address": "email",
  email_address: "email",
  "e-mail": "email",
  mail: "email",
  org: "organization",
  organisation: "organization",
  company: "organization",
  "job title": "jobTitle",
  job_title: "jobTitle",
  title: "jobTitle",
  position: "jobTitle",
  role: "jobTitle",
  country: "nationality",
  nation: "nationality",
  "registration code": "registrationCode",
  registration_code: "registrationCode",
  "reg code": "registrationCode",
  reg_code: "registrationCode",
  code: "registrationCode",
};

// ─── Levenshtein distance ────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

// ─── Suggest column mappings ─────────────────────────────

export function suggestColumnMappings(
  headers: string[],
  targetFields: FieldInfo[],
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  // Step 1: Exact match (case-insensitive, trimmed)
  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    const target = targetFields.find(
      (f) => f.name.toLowerCase() === normalized || f.label.toLowerCase() === normalized,
    );
    if (target && !usedTargets.has(target.name)) {
      mappings.push({ sourceColumn: header, targetField: target.name });
      usedTargets.add(target.name);
    }
  }

  // Step 2: Alias matching
  for (const header of headers) {
    if (mappings.some((m) => m.sourceColumn === header)) continue;
    const normalized = header.trim().toLowerCase();
    const aliasTarget = ALIASES[normalized];
    if (aliasTarget && !usedTargets.has(aliasTarget)) {
      mappings.push({ sourceColumn: header, targetField: aliasTarget });
      usedTargets.add(aliasTarget);
    }
  }

  // Step 3: Levenshtein distance ≤ 2
  for (const header of headers) {
    if (mappings.some((m) => m.sourceColumn === header)) continue;
    const normalized = header.trim().toLowerCase();

    let bestTarget: string | null = null;
    let bestDist = 3; // threshold

    for (const field of targetFields) {
      if (usedTargets.has(field.name)) continue;
      const dist = Math.min(
        levenshtein(normalized, field.name.toLowerCase()),
        levenshtein(normalized, field.label.toLowerCase()),
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = field.name;
      }
    }

    if (bestTarget) {
      mappings.push({ sourceColumn: header, targetField: bestTarget });
      usedTargets.add(bestTarget);
    }
  }

  return mappings;
}

// ─── Apply mappings ──────────────────────────────────────

function applyTransform(value: string, transform?: string): string {
  if (!transform) return value;
  switch (transform) {
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "trim":
      return value.trim();
    case "date-parse": {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? value : parsed.toISOString();
    }
    default:
      return value;
  }
}

export function applyMappings(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceColumn] ?? "";
      mapped[mapping.targetField] = applyTransform(rawValue, mapping.transform);
    }
    return mapped;
  });
}
