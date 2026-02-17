import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DatePicker } from "~/components/ui/date-picker";
import { AlertTriangle, Send, Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
}

interface ParticipantType {
  id: string;
  name: string;
}

interface BroadcastComposerProps {
  eventId: string;
  templates: Template[];
  participantTypes: ParticipantType[];
  onCancel: () => void;
}

const VARIABLE_BUTTONS = [
  "firstName",
  "lastName",
  "email",
  "registrationCode",
  "eventName",
  "organization",
];

export function BroadcastComposer({
  eventId,
  templates,
  participantTypes,
  onCancel,
}: BroadcastComposerProps) {
  const fetcher = useFetcher();
  const countFetcher = useFetcher();

  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isSubmitting = fetcher.state !== "idle";

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setBody(template.body);
        setSubject(template.subject ?? "");
        setChannel(template.channel);
      }
    }
  }

  function insertVariable(varName: string) {
    setBody((prev) => prev + `{{${varName}}}`);
  }

  function handleCountAudience() {
    const formData = new FormData();
    formData.set("_action", "countAudience");
    formData.set("eventId", eventId);
    formData.set("participantTypes", JSON.stringify(selectedTypes));
    formData.set("statuses", JSON.stringify(selectedStatuses));
    countFetcher.submit(formData, { method: "POST" });
  }

  function handleSendClick() {
    setShowConfirmDialog(true);
  }

  function handleConfirmSend() {
    setShowConfirmDialog(false);
    const formData = new FormData();
    formData.set("_action", scheduleMode === "schedule" ? "schedule" : "send");
    formData.set("eventId", eventId);
    formData.set("subject", subject);
    formData.set("body", body);
    formData.set("channel", channel);
    formData.set("isEmergency", String(isEmergency));
    formData.set("templateId", selectedTemplate);
    formData.set(
      "filters",
      JSON.stringify({
        participantTypes: selectedTypes,
        statuses: selectedStatuses,
      }),
    );
    if (scheduledAt && scheduleMode === "schedule") {
      formData.set("scheduledAt", scheduledAt.toISOString());
    }
    fetcher.submit(formData, { method: "POST" });
  }

  const audienceCount =
    countFetcher.data && typeof countFetcher.data === "object" && "count" in countFetcher.data
      ? (countFetcher.data as { count: number }).count
      : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New Broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Picker */}
          {templates.length > 0 && (
            <div>
              <Label>Template (optional)</Label>
              <NativeSelect
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full"
              >
                <NativeSelectOption value="">None — compose from scratch</NativeSelectOption>
                {templates.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name} ({t.channel})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Channel */}
          <div>
            <Label>Channel</Label>
            <NativeSelect
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="EMAIL">Email</NativeSelectOption>
              <NativeSelectOption value="SMS">SMS</NativeSelectOption>
              <NativeSelectOption value="PUSH">Push</NativeSelectOption>
              <NativeSelectOption value="IN_APP">In-App</NativeSelectOption>
            </NativeSelect>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Broadcast subject"
            />
          </div>

          {/* Body */}
          <div>
            <Label>Body</Label>
            <div className="mb-2 flex flex-wrap gap-1">
              {VARIABLE_BUTTONS.map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(v)}
                  className="text-xs"
                >
                  {`{{${v}}}`}
                </Button>
              ))}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              required
            />
          </div>

          <Separator />

          {/* Audience Filter */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Audience Filter</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Participant Types</Label>
                <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded border p-2">
                  {participantTypes.map((pt) => (
                    <label key={pt.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(pt.id)}
                        onChange={(e) => {
                          setSelectedTypes((prev) =>
                            e.target.checked ? [...prev, pt.id] : prev.filter((id) => id !== pt.id),
                          );
                        }}
                      />
                      {pt.name}
                    </label>
                  ))}
                  {participantTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">No participant types</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1 space-y-1 rounded border p-2">
                  {["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED", "PRINTED"].map(
                    (status) => (
                      <label key={status} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={(e) => {
                            setSelectedStatuses((prev) =>
                              e.target.checked
                                ? [...prev, status]
                                : prev.filter((s) => s !== status),
                            );
                          }}
                        />
                        {status}
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCountAudience}
                disabled={countFetcher.state !== "idle"}
              >
                Count Audience
              </Button>
              {audienceCount !== null && (
                <span className="text-sm text-muted-foreground">
                  {audienceCount} recipient{audienceCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={scheduleMode === "now"}
                onChange={() => setScheduleMode("now")}
              />
              <Send className="size-4" /> Send Now
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={scheduleMode === "schedule"}
                onChange={() => setScheduleMode("schedule")}
              />
              <Clock className="size-4" /> Schedule
            </label>
          </div>

          {scheduleMode === "schedule" && (
            <div>
              <Label>Scheduled Date & Time</Label>
              <DatePicker value={scheduledAt} onChange={setScheduledAt} />
            </div>
          )}

          {/* Emergency */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
            />
            <AlertTriangle className="size-4 text-destructive" />
            Emergency broadcast (highest priority)
          </label>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" onClick={handleSendClick} disabled={!body || isSubmitting}>
              {scheduleMode === "schedule" ? "Schedule Broadcast" : "Send Broadcast"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast</DialogTitle>
            <DialogDescription>
              {scheduleMode === "schedule"
                ? "This broadcast will be scheduled for delivery."
                : "This will immediately start sending the broadcast."}
              {audienceCount !== null && (
                <>
                  {" "}
                  Estimated recipients: <strong>{audienceCount}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {isEmergency && (
            <div className="flex items-center gap-2 rounded border border-destructive bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="size-4 text-destructive" />
              This is an emergency broadcast and will be sent with highest priority.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
