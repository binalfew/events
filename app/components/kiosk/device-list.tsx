import { useState } from "react";
import { useFetcher } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface Device {
  id: string;
  name: string;
  location: string;
  mode: string;
  isOnline: boolean;
  lastHeartbeat: string;
  language: string;
}

interface DeviceListProps {
  devices: Device[];
  onEdit: (device: Device) => void;
}

export function DeviceList({ devices, onEdit }: DeviceListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Location</th>
            <th className="pb-2 pr-4 font-medium">Mode</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Last Heartbeat</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {devices.map((device) => (
            <DeviceRow key={device.id} device={device} onEdit={() => onEdit(device)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceRow({ device, onEdit }: { device: Device; onEdit: () => void }) {
  const deleteFetcher = useFetcher();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const relativeTime = formatRelativeTime(device.lastHeartbeat);

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/kiosk/${device.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <tr>
      <td className="py-3 pr-4 font-medium">{device.name}</td>
      <td className="py-3 pr-4 text-muted-foreground">{device.location}</td>
      <td className="py-3 pr-4">
        <Badge variant="secondary">{device.mode}</Badge>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${device.isOnline ? "bg-green-500" : "bg-red-500"}`}
          />
          <span>{device.isOnline ? "Online" : "Offline"}</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-muted-foreground">{relativeTime}</td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyUrl}>
            Copy URL
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Decommission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Decommission Device</DialogTitle>
                <DialogDescription>
                  This will permanently remove the device "{device.name}" and all associated
                  sessions. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteFetcher.submit(
                      { _action: "decommission", id: device.id },
                      { method: "POST" },
                    );
                    setDeleteOpen(false);
                  }}
                >
                  Decommission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </td>
    </tr>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
