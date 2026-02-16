import { useCallback } from "react";
import { useRevalidator } from "react-router";
import { useSSE } from "~/hooks/use-sse";
import { toast } from "~/hooks/use-toast";
import type { SSEChannel, SSEEventType } from "~/types/sse-events";

const SSE_CHANNELS: SSEChannel[] = ["validation", "notifications", "dashboard"];

interface SSEProviderProps {
  enabled: boolean;
  children: React.ReactNode;
}

export function SSEProvider({ enabled, children }: SSEProviderProps) {
  const revalidator = useRevalidator();

  const handleEvent = useCallback(
    (event: { type: SSEEventType; data: Record<string, unknown> }) => {
      const { type, data } = event;

      switch (type) {
        case "participant:approved":
          toast({
            variant: "success",
            title: "Participant Approved",
            description: `${data.participantName} was approved at "${data.stepName}"`,
          });
          break;

        case "participant:rejected":
          toast({
            variant: "destructive",
            title: "Participant Rejected",
            description: `${data.participantName} was rejected at "${data.stepName}"`,
          });
          break;

        case "sla:warning":
          toast({
            variant: "destructive",
            title: "SLA Warning",
            description: `${data.participantName} has ${data.remainingMinutes} minutes remaining at "${data.stepName}"`,
          });
          break;

        case "sla:breached":
          toast({
            variant: "destructive",
            title: "SLA Breached",
            description: `${data.participantName} is ${data.overdueMinutes} minutes overdue at "${data.stepName}"`,
          });
          break;

        case "notification:new":
          toast({
            title: String(data.title || "Notification"),
            description: String(data.message || ""),
          });
          // Revalidate layout to update bell badge and dropdown
          revalidator.revalidate();
          break;
      }
    },
    [revalidator],
  );

  useSSE({
    channels: SSE_CHANNELS,
    onEvent: handleEvent,
    enabled,
  });

  return <>{children}</>;
}
