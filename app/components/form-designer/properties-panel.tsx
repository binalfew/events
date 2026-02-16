import { Settings2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { ConditionBuilder } from "./condition-builder";
import type {
  FormDefinition,
  FormPage,
  FormSection,
  FormFieldPlacement,
  VisibilityCondition,
} from "~/types/form-designer";
import type { SelectedElementType } from "~/types/designer-state";

interface FieldDefinitionLookup {
  id: string;
  label: string;
  dataType: string;
  name: string;
}

interface PropertiesPanelProps {
  definition: FormDefinition;
  selectedElementId: string | null;
  selectedElementType: SelectedElementType;
  fieldDefinitions: FieldDefinitionLookup[];
  onUpdatePage: (pageId: string, updates: Partial<Omit<FormPage, "id" | "sections">>) => void;
  onUpdateSection: (
    pageId: string,
    sectionId: string,
    updates: Partial<Omit<FormSection, "id" | "fields">>,
  ) => void;
  onUpdateField: (
    pageId: string,
    sectionId: string,
    fieldId: string,
    updates: Partial<Omit<FormFieldPlacement, "id">>,
  ) => void;
}

export function PropertiesPanel({
  definition,
  selectedElementId,
  selectedElementType,
  fieldDefinitions,
  onUpdatePage,
  onUpdateSection,
  onUpdateField,
}: PropertiesPanelProps) {
  if (!selectedElementId || !selectedElementType) {
    return (
      <div className="flex h-full w-[320px] shrink-0 flex-col border-l bg-background">
        <div className="border-b px-3 py-2">
          <h3 className="text-sm font-medium">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center text-xs text-muted-foreground">
            <Settings2 className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p>Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l bg-background">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-medium">Properties</h3>
        <p className="text-xs text-muted-foreground capitalize">{selectedElementType}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="general">
          <TabsList className="mx-3 mt-2 w-auto">
            <TabsTrigger value="general" className="text-xs">
              General
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              Layout
            </TabsTrigger>
            <TabsTrigger value="visibility" className="text-xs">
              Visibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-3">
            {selectedElementType === "page" && (
              <PageProperties
                definition={definition}
                pageId={selectedElementId}
                onUpdate={onUpdatePage}
              />
            )}
            {selectedElementType === "section" && (
              <SectionProperties
                definition={definition}
                sectionId={selectedElementId}
                onUpdate={onUpdateSection}
              />
            )}
            {selectedElementType === "field" && (
              <FieldProperties
                definition={definition}
                fieldId={selectedElementId}
                fieldDefinitions={fieldDefinitions}
                onUpdate={onUpdateField}
              />
            )}
          </TabsContent>

          <TabsContent value="layout" className="p-3">
            {selectedElementType === "section" && (
              <SectionLayoutProperties
                definition={definition}
                sectionId={selectedElementId}
                onUpdate={onUpdateSection}
              />
            )}
            {selectedElementType === "field" && (
              <FieldLayoutProperties
                definition={definition}
                fieldId={selectedElementId}
                onUpdate={onUpdateField}
              />
            )}
            {selectedElementType === "page" && (
              <p className="text-xs text-muted-foreground">No layout properties for pages.</p>
            )}
          </TabsContent>

          <TabsContent value="visibility" className="p-3">
            {selectedElementType === "page" && (
              <PageVisibilityProperties
                definition={definition}
                pageId={selectedElementId}
                fieldDefinitions={fieldDefinitions}
                onUpdate={onUpdatePage}
              />
            )}
            {selectedElementType === "section" && (
              <SectionVisibilityProperties
                definition={definition}
                sectionId={selectedElementId}
                fieldDefinitions={fieldDefinitions}
                onUpdate={onUpdateSection}
              />
            )}
            {selectedElementType === "field" && (
              <FieldVisibilityProperties
                definition={definition}
                fieldId={selectedElementId}
                fieldDefinitions={fieldDefinitions}
                onUpdate={onUpdateField}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function findPageAndSection(definition: FormDefinition, sectionId: string) {
  for (const page of definition.pages) {
    const section = page.sections.find((s) => s.id === sectionId);
    if (section) return { page, section };
  }
  return null;
}

function findFieldLocation(definition: FormDefinition, fieldId: string) {
  for (const page of definition.pages) {
    for (const section of page.sections) {
      const field = section.fields.find((f) => f.id === fieldId);
      if (field) return { page, section, field };
    }
  }
  return null;
}

// ─── Page Properties ─────────────────────────────────────

function PageProperties({
  definition,
  pageId,
  onUpdate,
}: {
  definition: FormDefinition;
  pageId: string;
  onUpdate: PropertiesPanelProps["onUpdatePage"];
}) {
  const page = definition.pages.find((p) => p.id === pageId);
  if (!page) return null;

  return (
    <div className="space-y-3">
      <PropertyField label="Title">
        <Input
          value={page.title}
          onChange={(e) => onUpdate(pageId, { title: e.target.value })}
          className="h-7 text-xs"
        />
      </PropertyField>
      <PropertyField label="Description">
        <Input
          value={page.description ?? ""}
          onChange={(e) => onUpdate(pageId, { description: e.target.value || undefined })}
          className="h-7 text-xs"
          placeholder="Optional description"
        />
      </PropertyField>
    </div>
  );
}

// ─── Section Properties ──────────────────────────────────

function SectionProperties({
  definition,
  sectionId,
  onUpdate,
}: {
  definition: FormDefinition;
  sectionId: string;
  onUpdate: PropertiesPanelProps["onUpdateSection"];
}) {
  const found = findPageAndSection(definition, sectionId);
  if (!found) return null;
  const { page, section } = found;

  return (
    <div className="space-y-3">
      <PropertyField label="Title">
        <Input
          value={section.title}
          onChange={(e) => onUpdate(page.id, sectionId, { title: e.target.value })}
          className="h-7 text-xs"
        />
      </PropertyField>
      <PropertyField label="Description">
        <Input
          value={section.description ?? ""}
          onChange={(e) =>
            onUpdate(page.id, sectionId, { description: e.target.value || undefined })
          }
          className="h-7 text-xs"
          placeholder="Optional description"
        />
      </PropertyField>
      <PropertyField label="Collapsible">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={section.collapsible}
            onChange={(e) => onUpdate(page.id, sectionId, { collapsible: e.target.checked })}
            className="rounded border-input"
          />
          Allow collapse
        </label>
      </PropertyField>
      {section.collapsible && (
        <PropertyField label="Default Collapsed">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={section.defaultCollapsed ?? false}
              onChange={(e) => onUpdate(page.id, sectionId, { defaultCollapsed: e.target.checked })}
              className="rounded border-input"
            />
            Start collapsed
          </label>
        </PropertyField>
      )}
    </div>
  );
}

function SectionLayoutProperties({
  definition,
  sectionId,
  onUpdate,
}: {
  definition: FormDefinition;
  sectionId: string;
  onUpdate: PropertiesPanelProps["onUpdateSection"];
}) {
  const found = findPageAndSection(definition, sectionId);
  if (!found) return null;
  const { page, section } = found;

  return (
    <div className="space-y-3">
      <PropertyField label="Columns">
        <div className="flex gap-1">
          {([1, 2, 3, 4] as const).map((cols) => (
            <button
              key={cols}
              onClick={() => onUpdate(page.id, sectionId, { columns: cols })}
              className={cn(
                "rounded border px-2.5 py-1 text-xs transition-colors",
                section.columns === cols
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {cols}
            </button>
          ))}
        </div>
      </PropertyField>
    </div>
  );
}

// ─── Field Properties ────────────────────────────────────

function FieldProperties({
  definition,
  fieldId,
  fieldDefinitions,
  onUpdate,
}: {
  definition: FormDefinition;
  fieldId: string;
  fieldDefinitions: FieldDefinitionLookup[];
  onUpdate: PropertiesPanelProps["onUpdateField"];
}) {
  const found = findFieldLocation(definition, fieldId);
  if (!found) return null;
  const { page, section, field } = found;
  const fdLookup = fieldDefinitions.find((fd) => fd.id === field.fieldDefinitionId);

  return (
    <div className="space-y-3">
      <PropertyField label="Field">
        <p className="text-xs font-medium">{fdLookup?.label ?? "Unknown"}</p>
        <p className="text-[10px] text-muted-foreground">
          {fdLookup?.name} ({fdLookup?.dataType})
        </p>
      </PropertyField>
      <PropertyField label="Order">
        <Input
          type="number"
          min={0}
          value={field.order}
          onChange={(e) =>
            onUpdate(page.id, section.id, fieldId, { order: parseInt(e.target.value) || 0 })
          }
          className="h-7 w-20 text-xs"
        />
      </PropertyField>
    </div>
  );
}

function FieldLayoutProperties({
  definition,
  fieldId,
  onUpdate,
}: {
  definition: FormDefinition;
  fieldId: string;
  onUpdate: PropertiesPanelProps["onUpdateField"];
}) {
  const found = findFieldLocation(definition, fieldId);
  if (!found) return null;
  const { page, section, field } = found;

  return (
    <div className="space-y-3">
      <PropertyField label="Column Span">
        <Input
          type="number"
          min={1}
          max={12}
          value={field.colSpan ?? 1}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val >= 1 && val <= 12) {
              onUpdate(page.id, section.id, fieldId, {
                colSpan: val as FormFieldPlacement["colSpan"],
              });
            }
          }}
          className="h-7 w-20 text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          How many grid columns this field spans (1-12)
        </p>
      </PropertyField>
    </div>
  );
}

// ─── Page Visibility ─────────────────────────────────────

function PageVisibilityProperties({
  definition,
  pageId,
  fieldDefinitions,
  onUpdate,
}: {
  definition: FormDefinition;
  pageId: string;
  fieldDefinitions: FieldDefinitionLookup[];
  onUpdate: PropertiesPanelProps["onUpdatePage"];
}) {
  const page = definition.pages.find((p) => p.id === pageId);
  if (!page) return null;

  return (
    <ConditionBuilder
      condition={page.visibleIf}
      availableFields={fieldDefinitions}
      onChange={(condition) => onUpdate(pageId, { visibleIf: condition })}
    />
  );
}

// ─── Section Visibility ──────────────────────────────────

function SectionVisibilityProperties({
  definition,
  sectionId,
  fieldDefinitions,
  onUpdate,
}: {
  definition: FormDefinition;
  sectionId: string;
  fieldDefinitions: FieldDefinitionLookup[];
  onUpdate: PropertiesPanelProps["onUpdateSection"];
}) {
  const found = findPageAndSection(definition, sectionId);
  if (!found) return null;

  return (
    <ConditionBuilder
      condition={found.section.visibleIf}
      availableFields={fieldDefinitions}
      onChange={(condition) => onUpdate(found.page.id, sectionId, { visibleIf: condition })}
    />
  );
}

// ─── Field Visibility ────────────────────────────────────

function FieldVisibilityProperties({
  definition,
  fieldId,
  fieldDefinitions,
  onUpdate,
}: {
  definition: FormDefinition;
  fieldId: string;
  fieldDefinitions: FieldDefinitionLookup[];
  onUpdate: PropertiesPanelProps["onUpdateField"];
}) {
  const found = findFieldLocation(definition, fieldId);
  if (!found) return null;

  return (
    <ConditionBuilder
      condition={found.field.visibleIf}
      availableFields={fieldDefinitions}
      excludeFieldId={found.field.fieldDefinitionId}
      onChange={(condition) =>
        onUpdate(found.page.id, found.section.id, fieldId, { visibleIf: condition })
      }
    />
  );
}

// ─── Shared ──────────────────────────────────────────────

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
