import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";

interface Checkpoint {
  id: string;
  name: string;
  location?: string | null;
  type: string;
  isActive: boolean;
}

interface CheckpointSelectorProps {
  checkpoints: Checkpoint[];
  value: string;
  onChange: (checkpointId: string) => void;
}

export function CheckpointSelector({ checkpoints, value, onChange }: CheckpointSelectorProps) {
  const active = checkpoints.filter((cp) => cp.isActive);

  return (
    <div className="space-y-1">
      <Label htmlFor="checkpoint-select">Checkpoint</Label>
      <NativeSelect id="checkpoint-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <NativeSelectOption value="">Select a checkpoint...</NativeSelectOption>
        {active.map((cp) => (
          <NativeSelectOption key={cp.id} value={cp.id}>
            {cp.name}
            {cp.location ? ` (${cp.location})` : ""}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {active.length === 0 && (
        <p className="text-xs text-destructive">No active checkpoints. Configure one first.</p>
      )}
    </div>
  );
}
