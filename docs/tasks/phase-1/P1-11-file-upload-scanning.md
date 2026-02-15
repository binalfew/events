# P1-11: File Upload Scanning

| Field                  | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Task ID**            | P1-11                                                                       |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                       |
| **Category**           | Security                                                                    |
| **Suggested Assignee** | Senior Backend Engineer                                                     |
| **Depends On**         | P1-00                                                                       |
| **Blocks**             | None                                                                        |
| **Estimated Effort**   | 2 days                                                                      |
| **Module References**  | [Module 05 §File Scanning](../../modules/05-SECURITY-AND-ACCESS-CONTROL.md) |

---

## Context

The platform accepts file uploads (passport scans, photos, documents) as part of the accreditation process. Malicious files (malware, trojans) must be detected and rejected before storage. This task integrates ClamAV (open-source antivirus) running as a Docker sidecar for scanning uploaded files.

---

## Deliverables

### 1. ClamAV Docker Service

Add ClamAV to `docker-compose.yml`:

```yaml
services:
  clamav:
    image: clamav/clamav:latest
    container_name: events-clamav
    restart: unless-stopped
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav
    healthcheck:
      test: ["CMD", "clamdcheck"]
      interval: 60s
      timeout: 10s
      retries: 3

volumes:
  clamav-data:
```

### 2. ClamAV Client (`app/services/file-scanning.server.ts`)

Connect to ClamAV daemon via TCP socket (clamd protocol):

```typescript
import net from "node:net";

interface ScanResult {
  safe: boolean;
  threats?: string[];
  scanTimeMs: number;
}

/**
 * Scan a file buffer for malware using ClamAV daemon.
 * Communicates via the clamd INSTREAM protocol.
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult>;

/**
 * Check if ClamAV is available and ready.
 * Returns false if the daemon is not reachable (scan is skipped gracefully).
 */
export async function isClamAVAvailable(): Promise<boolean>;
```

**INSTREAM protocol:**

1. Connect to ClamAV daemon on `CLAMAV_HOST:CLAMAV_PORT`
2. Send `zINSTREAM\0`
3. Send file chunks: 4-byte big-endian length prefix + chunk data
4. Send terminator: 4 zero bytes
5. Read response: `stream: OK\0` (clean) or `stream: {virus_name} FOUND\0` (infected)

### 3. Upload Middleware (`app/services/file-upload.server.ts`)

Scan-before-store pipeline:

```typescript
interface UploadResult {
  allowed: boolean;
  reason?: string;
  fileId?: string;
  url?: string;
}

/**
 * Process a file upload: validate, scan, store.
 *
 * Pipeline:
 * 1. Validate file type against allowlist
 * 2. Validate file size against limit
 * 3. Scan with ClamAV (skip gracefully if unavailable)
 * 4. Store file (local filesystem for now, Azure Blob Storage later)
 * 5. Return file metadata
 */
export async function processFileUpload(
  file: File,
  options: {
    tenantId: string;
    uploadedBy: string;
    allowedTypes?: string[];
    maxSizeMB?: number;
  },
): Promise<UploadResult>;
```

**Validation order:**

1. **MIME type check** — reject files not in the allowlist
2. **Magic bytes check** — verify file content matches claimed MIME type (prevent `.exe` renamed to `.jpg`)
3. **Size check** — reject files exceeding the size limit
4. **ClamAV scan** — reject infected files

**Default allowlist:**

```typescript
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
```

### 4. File Storage (Local — Phase 1)

For Phase 1, store files on the local filesystem (Azure Blob Storage integration deferred):

```typescript
/**
 * Store a file on the local filesystem.
 * Files are organized by tenant: uploads/{tenantId}/{year}/{month}/{fileId}
 */
export async function storeFileLocally(
  buffer: Buffer,
  tenantId: string,
  originalName: string,
  mimeType: string,
): Promise<{ fileId: string; path: string; url: string }>;
```

- Store files outside the web root (`data/uploads/`)
- Generate a random file ID (CUID) for the filename
- Preserve the original extension
- Return a URL path for serving: `/api/v1/files/{fileId}`

### 5. File Serve Route (`app/routes/api.v1.files.$fileId.tsx`)

Serve uploaded files with proper headers:

```typescript
export async function loader({ params, request }: LoaderFunctionArgs) {
  // Authenticate the request
  // Verify the file belongs to the user's tenant
  // Stream the file with correct Content-Type and Content-Disposition
  // Set Cache-Control headers
}
```

### 6. Magic Bytes Validation (`app/services/file-scanning.server.ts`)

Validate that file content matches its claimed MIME type:

```typescript
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  // ... more types
};

export function validateMagicBytes(buffer: Buffer, claimedType: string): boolean;
```

### 7. Environment Configuration

```env
# .env.example additions
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_ENABLED=true
FILE_UPLOAD_MAX_SIZE_MB=100
FILE_UPLOAD_DIR=data/uploads
```

### 8. Audit Logging

All file operations are logged:

- `FILE_UPLOAD` — successful upload (file ID, type, size, uploader)
- `FILE_UPLOAD_BLOCKED` — scan failed (threat name, uploader, IP)
- Include scan time in metadata for performance monitoring

### 9. Graceful Degradation

If ClamAV is unavailable:

- In development: log a warning and allow the upload (skip scanning)
- In production: configurable behavior via `CLAMAV_REQUIRED` env var
  - `true` (default): reject uploads when ClamAV is down
  - `false`: allow uploads with a warning logged

### 10. Tests

Write tests for:

- Clean file passes scan and is stored
- Infected file is rejected with threat name
- File type validation rejects disallowed types
- Magic bytes validation catches mismatched types (e.g., `.exe` renamed to `.jpg`)
- File size limit is enforced
- ClamAV unavailable: graceful degradation based on config
- Files are stored in the correct tenant directory
- File serve route authenticates and checks tenant
- Audit log records both successful and blocked uploads
- EICAR test string triggers detection (standard antivirus test)

---

## Acceptance Criteria

- [ ] File uploads are scanned by ClamAV before storage
- [ ] Infected files are rejected with a clear error message
- [ ] File type validation checks both MIME type and magic bytes
- [ ] File size limit is enforced (default 100MB, configurable)
- [ ] Files are stored in tenant-isolated directories
- [ ] File serve route requires authentication and tenant check
- [ ] ClamAV container is added to `docker-compose.yml`
- [ ] Graceful degradation when ClamAV is unavailable (configurable)
- [ ] All file operations are logged to AuditLog
- [ ] EICAR test file is correctly detected as malware
- [ ] `.env.example` includes ClamAV configuration variables
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover scan, validation, storage, and degradation
