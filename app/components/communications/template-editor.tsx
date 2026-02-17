import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Plus } from "lucide-react";

interface TemplateEditorProps {
  defaultValues?: {
    name?: string;
    subject?: string;
    body?: string;
    channel?: string;
    variables?: string[];
  };
  mode: "create" | "edit";
  onCancel: () => void;
}

const COMMON_VARIABLES = [
  "firstName",
  "lastName",
  "email",
  "registrationCode",
  "eventName",
  "eventDate",
  "organization",
];

export function TemplateEditor({ defaultValues, mode, onCancel }: TemplateEditorProps) {
  const [body, setBody] = useState(defaultValues?.body ?? "");
  const [variables, setVariables] = useState<string[]>(defaultValues?.variables ?? []);
  const [newVariable, setNewVariable] = useState("");

  // Live preview with sample data
  const sampleData: Record<string, string> = {};
  for (const v of variables) {
    sampleData[v] = `[${v}]`;
  }

  const previewBody = body.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return sampleData[varName] !== undefined ? sampleData[varName] : match;
  });

  function insertVariable(varName: string) {
    setBody((prev) => prev + `{{${varName}}}`);
    if (!variables.includes(varName)) {
      setVariables((prev) => [...prev, varName]);
    }
  }

  function addCustomVariable() {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables((prev) => [...prev, newVariable]);
      setNewVariable("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name ?? ""}
            placeholder="e.g. Welcome Email"
            required
          />
        </div>

        <div>
          <Label htmlFor="channel">Channel</Label>
          <NativeSelect
            id="channel"
            name="channel"
            defaultValue={defaultValues?.channel ?? "EMAIL"}
            className="w-full"
          >
            <NativeSelectOption value="EMAIL">Email</NativeSelectOption>
            <NativeSelectOption value="SMS">SMS</NativeSelectOption>
            <NativeSelectOption value="PUSH">Push</NativeSelectOption>
            <NativeSelectOption value="IN_APP">In-App</NativeSelectOption>
          </NativeSelect>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            defaultValue={defaultValues?.subject ?? ""}
            placeholder="e.g. Welcome to {{eventName}}"
          />
        </div>

        <div>
          <Label htmlFor="body">Body</Label>
          <div className="mb-2 flex flex-wrap gap-1">
            {COMMON_VARIABLES.map((v) => (
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
            id="body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message here. Use {{variable}} for dynamic content."
            rows={8}
            required
          />
        </div>

        {/* Custom variable input */}
        <div>
          <Label>Custom Variables</Label>
          <div className="flex gap-2">
            <Input
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value.replace(/\W/g, ""))}
              placeholder="Add custom variable"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomVariable();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addCustomVariable}>
              <Plus className="size-4" />
            </Button>
          </div>
          {variables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {variables.map((v) => (
                <span key={v} className="rounded bg-muted px-2 py-0.5 text-xs">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        <input type="hidden" name="variables" value={JSON.stringify(variables)} />

        <div className="flex gap-2">
          <Button type="submit">{mode === "create" ? "Create Template" : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded border bg-muted/30 p-4">
            <div className="whitespace-pre-wrap text-sm">
              {previewBody || "Preview will appear here..."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
