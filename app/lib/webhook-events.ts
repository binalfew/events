// ─── Webhook Event Type Catalog ──────────────────────────

export const WEBHOOK_EVENTS = {
  "participant.registered": "A new participant has registered",
  "participant.approved": "A participant has been approved",
  "participant.rejected": "A participant has been rejected",
  "participant.bypassed": "A participant has been bypassed through a workflow step",
  "participant.status_changed": "A participant's workflow status has changed",
  "sla.warning": "An SLA deadline is approaching",
  "sla.breached": "An SLA deadline has been exceeded",
  "workflow.published": "A workflow version has been published",
  "scan.completed": "A badge scan has been completed",
  "bulk_operation.completed": "A bulk operation has finished processing",
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;

export const WEBHOOK_EVENT_TYPES = Object.keys(WEBHOOK_EVENTS) as WebhookEventType[];

/**
 * Validate an array of event types. Accepts individual event types or "*" wildcard.
 * Returns { valid: true } or { valid: false, invalid: string[] }.
 */
export function validateEventTypes(events: string[]): {
  valid: boolean;
  invalid: string[];
} {
  if (!Array.isArray(events) || events.length === 0) {
    return { valid: false, invalid: [] };
  }

  const invalid: string[] = [];
  for (const event of events) {
    if (event === "*") continue;
    if (!WEBHOOK_EVENT_TYPES.includes(event as WebhookEventType)) {
      invalid.push(event);
    }
  }

  return { valid: invalid.length === 0, invalid };
}

/**
 * Group event types by domain prefix for UI display.
 */
export function getEventsByDomain(): Record<
  string,
  { type: WebhookEventType; description: string }[]
> {
  const grouped: Record<string, { type: WebhookEventType; description: string }[]> = {};

  for (const [type, description] of Object.entries(WEBHOOK_EVENTS)) {
    const domain = type.split(".")[0];
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push({ type: type as WebhookEventType, description });
  }

  return grouped;
}
