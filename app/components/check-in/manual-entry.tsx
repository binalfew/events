import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface ManualEntryProps {
  onSubmit: (registrationCode: string) => void;
  disabled?: boolean;
}

export function ManualEntry({ onSubmit, disabled }: ManualEntryProps) {
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setCode("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="manual-code">Registration Code</Label>
      <div className="flex gap-2">
        <Input
          id="manual-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter registration code"
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || !code.trim()}>
          {disabled ? "Checking..." : "Check In"}
        </Button>
      </div>
    </form>
  );
}
