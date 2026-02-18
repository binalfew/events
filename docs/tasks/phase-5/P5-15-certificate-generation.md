# P5-15: Certificate Generation

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Task ID**            | P5-15                                                  |
| **Phase**              | 5 — Event Operations & Logistics                       |
| **Category**           | Feature                                                |
| **Suggested Assignee** | Full-stack Developer                                   |
| **Depends On**         | P5-00 (Foundation Models)                              |
| **Blocks**             | —                                                      |
| **Estimated Effort**   | 4 days                                                 |
| **Module References**  | [Module 14](../../modules/14-CONTENT-AND-DOCUMENTS.md) |

---

## Context

Events issue certificates of participation, attendance, or completion. Certificates are generated as PDFs from customizable templates with participant data merge, QR verification codes, and optional digital signatures. Bulk generation handles thousands of certificates efficiently. The `CertificateTemplate` and `Certificate` models were created in P5-00.

---

## Deliverables

### 1. Certificate Service

Create `app/services/certificates.server.ts`:

- `createTemplate(input, ctx)` — Design certificate template (name, HTML/CSS layout, merge fields, logo, signature)
- `listTemplates(eventId, tenantId)` — Templates with generation counts
- `previewTemplate(templateId, participantId)` — Generate preview PDF with real participant data
- `generateCertificate(templateId, participantId, ctx)` — Generate individual certificate with QR verification code
- `bulkGenerateCertificates(templateId, participantFilter, ctx)` — Bulk generate for filtered participants
- `getCertificate(id, tenantId)` — Certificate with download URL
- `verifyCertificate(verificationCode)` — Public endpoint: verify certificate authenticity via QR code
- `revokeCertificate(id, reason, ctx)` — Revoke issued certificate
- `getCertificateStats(eventId, tenantId)` — Generated/sent/downloaded/revoked counts
- `sendCertificate(certificateId, ctx)` — Email certificate to participant

### 2. PDF Generation

Use a server-side PDF library (e.g., `@react-pdf/renderer` or `puppeteer`) to render certificate templates with merged participant data and QR verification codes.

### 3. Zod Schemas

Create `app/lib/schemas/certificate.ts`

### 4. Admin UI Route

Create `app/routes/admin/events/$eventId/certificates.tsx`:

- Template management, preview, individual and bulk generation
- Certificate list with status, download links, send button
- Verification page (public route): `app/routes/verify.$code.tsx`

### 5. Tests

Create `app/services/__tests__/certificates.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Certificate templates with HTML/CSS layout and merge fields
- [ ] Template preview with real participant data
- [ ] Individual and bulk certificate generation as PDF
- [ ] QR verification code on each certificate
- [ ] Public verification page validates certificate authenticity
- [ ] Certificate revocation with reason
- [ ] Email delivery to participants
- [ ] Event card shows "Certificates" link in Comms section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
