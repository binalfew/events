// ─── SSE Channel Definitions ─────────────────────────────

export const SSE_CHANNELS = [
  "validation",
  "notifications",
  "dashboard",
  "occupancy",
  "communications",
] as const;
export type SSEChannel = (typeof SSE_CHANNELS)[number];

// ─── SSE Event Types ─────────────────────────────────────

export interface ParticipantApprovedEvent {
  type: "participant:approved";
  participantId: string;
  participantName: string;
  stepName: string;
}

export interface ParticipantRejectedEvent {
  type: "participant:rejected";
  participantId: string;
  participantName: string;
  stepName: string;
}

export interface SLAWarningEvent {
  type: "sla:warning";
  participantId: string;
  participantName: string;
  stepName: string;
  remainingMinutes: number;
}

export interface SLABreachedEvent {
  type: "sla:breached";
  participantId: string;
  participantName: string;
  stepName: string;
  overdueMinutes: number;
}

export interface NotificationNewEvent {
  type: "notification:new";
  notificationId: string;
  title: string;
  message: string;
}

export interface OccupancyUpdatedEvent {
  type: "occupancy:updated";
  eventId: string;
  zoneId: string | null;
  currentCount: number;
  maxCapacity: number;
}

export interface BroadcastProgressEvent {
  type: "broadcast:progress";
  broadcastId: string;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  total: number;
  status: string;
}

export type SSEEvent =
  | ParticipantApprovedEvent
  | ParticipantRejectedEvent
  | SLAWarningEvent
  | SLABreachedEvent
  | NotificationNewEvent
  | OccupancyUpdatedEvent
  | BroadcastProgressEvent;

export type SSEEventType = SSEEvent["type"];

// ─── Connection State ────────────────────────────────────

export type SSEConnectionState = "connecting" | "connected" | "disconnected";
