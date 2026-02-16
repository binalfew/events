import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutGrid,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { SortableField } from "./sortable-field";
import { makeSectionDndId, makeFieldDndId } from "./dnd-designer-context";
import type { FormSection } from "~/types/form-designer";

interface FieldDefinitionLookup {
  id: string;
  label: string;
  dataType: string;
  name: string;
}

interface SortableSectionProps {
  section: FormSection;
  sectionIndex: number;
  totalSections: number;
  fdMap: Map<string, FieldDefinitionLookup>;
  isSelected: boolean;
  selectedFieldId: string | null;
  onSelectSection: () => void;
  onSelectField: (fieldId: string) => void;
  onRemoveSection: () => void;
  onUpdateSection: (updates: Partial<Omit<FormSection, "id" | "fields">>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveField: (fieldId: string) => void;
}

export function SortableSection({
  section,
  sectionIndex,
  totalSections,
  fdMap,
  isSelected,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveSection,
  onUpdateSection,
  onMoveUp,
  onMoveDown,
  onRemoveField,
}: SortableSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.defaultCollapsed ?? false);
  const defaultColSpan = Math.floor(12 / section.columns);

  const sectionDndId = makeSectionDndId(section.id);

  // Sortable for section reordering
  const {
    attributes: sectionAttributes,
    listeners: sectionListeners,
    setNodeRef: setSectionNodeRef,
    transform: sectionTransform,
    transition: sectionTransition,
    isDragging: isSectionDragging,
  } = useSortable({
    id: sectionDndId,
    data: { type: "section", sectionId: section.id },
  });

  // Droppable zone for dropping fields into this section
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: sectionDndId,
    data: { type: "section", sectionId: section.id },
  });

  const sectionStyle = {
    transform: CSS.Transform.toString(sectionTransform),
    transition: sectionTransition,
  };

  // Field DnD IDs for SortableContext
  const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);
  const fieldDndIds = sortedFields.map((f) => makeFieldDndId(f.id));

  return (
    <div
      ref={setSectionNodeRef}
      style={sectionStyle}
      className={cn(
        "rounded-lg border bg-card transition-shadow",
        isSelected && "ring-2 ring-primary",
        isSectionDragging && "opacity-30 ring-2 ring-primary/30",
        isOver && !isSectionDragging && "ring-2 ring-primary/50 bg-primary/5",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection();
      }}
    >
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        {/* Section header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Drag handle for section */}
            <button
              className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
              {...sectionAttributes}
              {...sectionListeners}
            >
              <GripVertical className="size-3.5" />
            </button>
            {section.collapsible && (
              <CollapsibleTrigger asChild>
                <button
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>
            )}
            <LayoutGrid className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{section.title}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Column selector buttons */}
            <div className="flex gap-0.5">
              {([1, 2, 3, 4] as const).map((cols) => (
                <button
                  key={cols}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSection({ columns: cols });
                  }}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                    section.columns === cols
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                  title={`${cols} column${cols > 1 ? "s" : ""}`}
                >
                  {cols}
                </button>
              ))}
            </div>

            {/* Reorder buttons */}
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              disabled={sectionIndex === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Move up"
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              disabled={sectionIndex === totalSections - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Move down"
            >
              <ChevronDown className="size-3" />
            </Button>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSection();
              }}
              title="Delete section"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>

        {/* Fields grid */}
        <CollapsibleContent>
          <div ref={setDropRef} className="p-3">
            <SortableContext items={fieldDndIds} strategy={rectSortingStrategy}>
              {sortedFields.length === 0 ? (
                <EmptyDropZone columns={section.columns} isOver={isOver} />
              ) : (
                <div className="grid grid-cols-12 gap-2">
                  {sortedFields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      fdLookup={fdMap.get(field.fieldDefinitionId)}
                      isSelected={selectedFieldId === field.id}
                      colSpan={field.colSpan ?? defaultColSpan}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectField(field.id);
                      }}
                      onRemove={(e) => {
                        e.stopPropagation();
                        onRemoveField(field.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Empty Drop Zone ─────────────────────────────────────

function EmptyDropZone({ columns, isOver }: { columns: number; isOver: boolean }) {
  const guideCount = columns - 1;

  return (
    <div
      className={cn(
        "relative rounded border border-dashed py-6 text-center text-xs text-muted-foreground transition-colors",
        isOver && "border-primary bg-primary/5 text-primary",
      )}
    >
      {guideCount > 0 && (
        <div className="pointer-events-none absolute inset-0 flex" aria-hidden>
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1",
                i < guideCount && "border-r border-dashed border-muted-foreground/15",
              )}
            />
          ))}
        </div>
      )}
      <span className="relative">
        {isOver ? "Drop field here" : "Drag a field here or click in the palette"}
      </span>
    </div>
  );
}
