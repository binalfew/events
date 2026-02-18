import { z } from "zod/v4";

export const createWidgetSchema = z.object({
  eventId: z.string().cuid(),
  widgetType: z.enum([
    "STAT_CARD",
    "INCIDENT_LIST",
    "CHECKIN_CHART",
    "TRANSPORT_STATUS",
    "OCCUPANCY",
    "QUEUE_STATUS",
    "ALERT_FEED",
    "TIMELINE",
  ]),
  title: z.string().min(1, "Title is required").max(200),
  config: z.string().optional().default("{}"),
  gridX: z.coerce.number().int().min(0).default(0),
  gridY: z.coerce.number().int().min(0).default(0),
  gridW: z.coerce.number().int().min(1).max(12).default(3),
  gridH: z.coerce.number().int().min(1).max(6).default(2),
  refreshRate: z.coerce.number().int().min(1).max(300).default(5),
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;

export const createAlertRuleSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
  metric: z.enum([
    "open_incidents",
    "critical_incidents",
    "checkin_rate",
    "queue_wait_time",
    "occupancy_rate",
    "transport_delays",
    "unassigned_rooms",
  ]),
  condition: z.enum(["gt", "gte", "lt", "lte", "eq"]),
  threshold: z.coerce.number(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  cooldownMinutes: z.coerce.number().int().min(1).max(1440).default(15),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
