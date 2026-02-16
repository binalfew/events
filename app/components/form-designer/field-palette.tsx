import { useState } from "react";
import { Link } from "react-router";
import { useDraggable } from "@dnd-kit/core";
import { Search, GripVertical } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "~/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { getFieldTypeIcon, getFieldTypeLabel, fieldCategories } from "./field-type-icons";
import { makePaletteDndId } from "./dnd-designer-context";

interface FieldDefinitionItem {
  id: string;
  name: string;
  label: string;
  dataType: string;
}

interface FieldPaletteProps {
  fields: FieldDefinitionItem[];
  eventId: string;
  activePageId: string | null;
  activeSectionId: string | null;
  onAddField: (fieldDefinitionId: string) => void;
}

export function FieldPalette({
  fields,
  eventId,
  activePageId,
  activeSectionId,
  onAddField,
}: FieldPaletteProps) {
  const [search, setSearch] = useState("");

  const filteredFields = fields.filter(
    (f) =>
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Group fields by category (matching their dataType to field categories)
  const groupedFields = fieldCategories
    .map((cat) => ({
      ...cat,
      fields: filteredFields.filter((f) => cat.types.includes(f.dataType)),
    }))
    .filter((cat) => cat.fields.length > 0);

  const canAdd = activePageId !== null && activeSectionId !== null;

  return (
    <div className="flex h-full w-[250px] shrink-0 flex-col border-r bg-background">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-medium">Fields</h3>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {fields.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p>No fields defined yet.</p>
            <Link
              to={`/admin/events/${eventId}/fields/new`}
              className="mt-1 inline-block text-primary hover:underline"
            >
              Create fields
            </Link>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No fields match &ldquo;{search}&rdquo;
          </div>
        ) : (
          groupedFields.map((group) => (
            <Collapsible key={group.label} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronRight className="size-3 transition-transform [[data-state=open]>&]:rotate-90" />
                {group.label}
                <span className="ml-auto text-[10px]">{group.fields.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-1 space-y-0.5 pb-2">
                  {group.fields.map((field) => (
                    <DraggablePaletteItem
                      key={field.id}
                      field={field}
                      canAdd={canAdd}
                      onAddField={onAddField}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Draggable Palette Item ──────────────────────────────

function DraggablePaletteItem({
  field,
  canAdd,
  onAddField,
}: {
  field: FieldDefinitionItem;
  canAdd: boolean;
  onAddField: (fieldDefinitionId: string) => void;
}) {
  const dndId = makePaletteDndId(field.id);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dndId,
    data: { type: "palette", fieldDefinitionId: field.id },
  });

  const Icon = getFieldTypeIcon(field.dataType);

  return (
    <button
      ref={setNodeRef}
      onClick={() => onAddField(field.id)}
      disabled={!canAdd}
      title={canAdd ? `Add "${field.label}" to current section` : "Select a section first"}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
        canAdd ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed",
        isDragging && "opacity-30",
      )}
    >
      <span
        className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </span>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{field.label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">
        {getFieldTypeLabel(field.dataType)}
      </span>
    </button>
  );
}
