import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { KIOSK_MODES, KIOSK_LANGUAGES } from "~/lib/schemas/kiosk-device";

interface Device {
  id: string;
  name: string;
  location: string;
  mode: string;
  language: string;
}

interface RegisterDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device; // if provided, edit mode
}

export function RegisterDeviceDialog({ open, onOpenChange, device }: RegisterDeviceDialogProps) {
  const fetcher = useFetcher();
  const isEdit = !!device;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Device" : "Register Device"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the kiosk device configuration."
              : "Register a new kiosk device for this event."}
          </DialogDescription>
        </DialogHeader>
        <fetcher.Form method="POST" onSubmit={() => onOpenChange(false)}>
          <input type="hidden" name="_action" value={isEdit ? "update" : "register"} />
          {device && <input type="hidden" name="id" value={device.id} />}
          <div className="space-y-4">
            <div>
              <Label htmlFor="device-name">Name</Label>
              <Input
                id="device-name"
                name="name"
                placeholder="Lobby Kiosk 1"
                defaultValue={device?.name ?? ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="device-location">Location</Label>
              <Input
                id="device-location"
                name="location"
                placeholder="Main Lobby, Ground Floor"
                defaultValue={device?.location ?? ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="device-mode">Mode</Label>
              <NativeSelect
                id="device-mode"
                name="mode"
                defaultValue={device?.mode ?? "self-service"}
                required
              >
                {KIOSK_MODES.map((m) => (
                  <NativeSelectOption key={m} value={m}>
                    {m.replace("-", " ")}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="device-language">Language</Label>
              <NativeSelect
                id="device-language"
                name="language"
                defaultValue={device?.language ?? "en"}
              >
                {KIOSK_LANGUAGES.map((l) => (
                  <NativeSelectOption key={l} value={l}>
                    {l}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle"
                ? isEdit
                  ? "Saving..."
                  : "Registering..."
                : isEdit
                  ? "Save Changes"
                  : "Register"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
