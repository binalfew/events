import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Copy, Pencil, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  channel: string;
  variables: string[];
  isSystem: boolean;
  subject: string | null;
  createdAt: string;
}

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onClone: (template: Template) => void;
}

const channelColors: Record<string, "default" | "secondary" | "outline"> = {
  EMAIL: "default",
  SMS: "secondary",
  PUSH: "outline",
  IN_APP: "secondary",
};

export function TemplateList({ templates, onEdit, onDelete, onClone }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No templates yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Channel</th>
            <th className="px-4 py-3 text-left font-medium">Variables</th>
            <th className="px-4 py-3 text-left font-medium">System</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{template.name}</div>
                {template.subject && (
                  <div className="text-xs text-muted-foreground">{template.subject}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={channelColors[template.channel] ?? "default"}>
                  {template.channel}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {template.variables.length > 0 ? template.variables.join(", ") : "None"}
              </td>
              <td className="px-4 py-3">
                {template.isSystem && <Badge variant="outline">System</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onClone(template)} title="Clone">
                    <Copy className="size-4" />
                  </Button>
                  {!template.isSystem && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(template)}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(template)}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
