import * as XLSX from "xlsx";
import { logger } from "~/lib/logger.server";

// ─── Constants ───────────────────────────────────────────

const MAX_ROWS = 10_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Types ───────────────────────────────────────────────

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  delimiter?: string;
}

// ─── CSV Parsing ─────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = 0;

  for (const delim of candidates) {
    const count = firstLine.split(delim).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }

  return best;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): ParseResult {
  // Strip UTF-8 BOM
  const cleaned = text.startsWith("\uFEFF") ? text.slice(1) : text;

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);

  const dataLines = lines.slice(1, MAX_ROWS + 1);
  const rows = dataLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? "";
    }
    return row;
  });

  return {
    headers,
    rows,
    totalRows: lines.length - 1,
    delimiter,
  };
}

// ─── XLSX Parsing ────────────────────────────────────────

function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (jsonRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = Object.keys(jsonRows[0]);
  const limited = jsonRows.slice(0, MAX_ROWS);
  const rows = limited.map((row) => {
    const mapped: Record<string, string> = {};
    for (const header of headers) {
      mapped[header] = String(row[header] ?? "");
    }
    return mapped;
  });

  return {
    headers,
    rows,
    totalRows: jsonRows.length,
  };
}

// ─── Public API ──────────────────────────────────────────

export async function parseImportFile(buffer: Buffer, mimeType: string): Promise<ParseResult> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const isXlsx =
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel";

  if (isXlsx) {
    logger.info({ mimeType, size: buffer.length }, "Parsing XLSX file");
    return parseXlsx(buffer);
  }

  // Default: treat as CSV (text/csv, text/plain, etc.)
  logger.info({ mimeType, size: buffer.length }, "Parsing CSV file");
  const text = buffer.toString("utf-8");
  return parseCsv(text);
}

export { MAX_ROWS, MAX_FILE_SIZE };
