import { useCallback, useEffect } from "react";
import { data, useLoaderData } from "react-router";
import { PanelLeft, PanelRight } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { getFormTemplate, FormTemplateError } from "~/services/form-templates.server";
import { useFormDesigner } from "~/hooks/use-form-designer";
import { useAutosave } from "~/hooks/use-autosave";
import { useIsMobile } from "~/hooks/use-mobile";
import { DesignerToolbar } from "~/components/form-designer/designer-toolbar";
import { FieldPalette } from "~/components/form-designer/field-palette";
import { DesignCanvas } from "~/components/form-designer/design-canvas";
import { PropertiesPanel } from "~/components/form-designer/properties-panel";
import { FormPreview } from "~/components/form-designer/form-preview";
import { DndDesignerContext } from "~/components/form-designer/dnd-designer-context";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import type { FormDefinition } from "~/types/form-designer";
import type { Route } from "./+types/$formId";

export const handle = { breadcrumb: "Designer" };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user, roles } = await requirePermission(request, "form", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.VISUAL_FORM_DESIGNER, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Visual form designer is not enabled" }, { status: 403 });
  }

  const { eventId, formId } = params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  try {
    const template = await getFormTemplate(formId, tenantId);

    const fieldDefinitions = await prisma.fieldDefinition.findMany({
      where: { tenantId, eventId },
      select: { id: true, name: true, label: true, dataType: true },
      orderBy: { sortOrder: "asc" },
    });

    return { event, template, fieldDefinitions };
  } catch (error) {
    if (error instanceof FormTemplateError) {
      throw data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function FormDesignerPage() {
  const { event, template, fieldDefinitions } = useLoaderData<typeof loader>();
  const isMobile = useIsMobile();

  const {
    state,
    canUndo,
    canRedo,
    undo,
    redo,
    selectElement,
    setActivePage,
    setViewMode,
    addPage,
    removePage,
    updatePage,
    addSection,
    removeSection,
    updateSection,
    addField,
    removeField,
    updateField,
    moveField,
    reorderPages,
    reorderSections,
    markSaved,
  } = useFormDesigner(template.definition as FormDefinition | null);

  const { status, lastSavedAt, saveNow } = useAutosave({
    id: template.id,
    definition: state.definition,
    isDirty: state.isDirty,
    onSaved: markSaved,
  });

  // beforeunload warning when dirty
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (state.isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.isDirty]);

  // Helper: resolve target section for palette add
  // Priority: selected section > section containing selected field > first section
  const activePage = state.definition.pages.find((p) => p.id === state.activePageId);
  const targetSectionId = (() => {
    if (state.selectedElementType === "section" && state.selectedElementId) {
      // Verify the selected section is on the active page
      if (activePage?.sections.some((s) => s.id === state.selectedElementId)) {
        return state.selectedElementId;
      }
    }
    if (state.selectedElementType === "field" && state.selectedElementId) {
      // Find which section contains the selected field
      const section = activePage?.sections.find((s) =>
        s.fields.some((f) => f.id === state.selectedElementId),
      );
      if (section) return section.id;
    }
    return activePage?.sections[0]?.id ?? null;
  })();

  const handleAddField = useCallback(
    (fieldDefinitionId: string) => {
      if (!state.activePageId || !targetSectionId) return;
      const section = activePage?.sections.find((s) => s.id === targetSectionId);
      const sectionFields = section?.fields ?? [];
      const defaultColSpan = Math.floor(
        12 / (section?.columns ?? 2),
      ) as FormDefinition["pages"][number]["sections"][number]["fields"][number]["colSpan"];
      addField(state.activePageId, targetSectionId, {
        id: crypto.randomUUID(),
        fieldDefinitionId,
        order: sectionFields.length,
        colSpan: defaultColSpan,
      });
    },
    [state.activePageId, targetSectionId, activePage, addField],
  );

  const handleAddPage = useCallback(() => {
    const pageCount = state.definition.pages.length;
    addPage({
      id: crypto.randomUUID(),
      title: `Page ${pageCount + 1}`,
      order: pageCount,
      sections: [
        {
          id: crypto.randomUUID(),
          title: "Section 1",
          columns: 2,
          collapsible: false,
          order: 0,
          fields: [],
        },
      ],
    });
  }, [state.definition.pages.length, addPage]);

  const handleAddSection = useCallback(
    (pageId: string) => {
      const page = state.definition.pages.find((p) => p.id === pageId);
      const sectionCount = page?.sections.length ?? 0;
      addSection(pageId, {
        id: crypto.randomUUID(),
        title: `Section ${sectionCount + 1}`,
        columns: 2,
        collapsible: false,
        order: sectionCount,
        fields: [],
      });
    },
    [state.definition.pages, addSection],
  );

  const handleAddFieldFromPalette = useCallback(
    (fieldDefinitionId: string, targetSectionId: string, order: number) => {
      if (!state.activePageId) return;
      const section = activePage?.sections.find((s) => s.id === targetSectionId);
      const defaultColSpan = Math.floor(
        12 / (section?.columns ?? 2),
      ) as FormDefinition["pages"][number]["sections"][number]["fields"][number]["colSpan"];
      addField(state.activePageId, targetSectionId, {
        id: crypto.randomUUID(),
        fieldDefinitionId,
        order,
        colSpan: defaultColSpan,
      });
    },
    [state.activePageId, activePage, addField],
  );

  const handleDuplicatePage = useCallback(
    (pageId: string) => {
      const page = state.definition.pages.find((p) => p.id === pageId);
      if (!page) return;
      const newPage = structuredClone(page);
      newPage.id = crypto.randomUUID();
      newPage.title = `${page.title} (Copy)`;
      newPage.order = state.definition.pages.length;
      newPage.sections = newPage.sections.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        fields: s.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
      }));
      addPage(newPage);
    },
    [state.definition.pages, addPage],
  );

  // ─── Render ─────────────────────────────────────────

  const paletteContent = (
    <FieldPalette
      fields={fieldDefinitions}
      eventId={event.id}
      activePageId={state.activePageId}
      activeSectionId={targetSectionId}
      onAddField={handleAddField}
    />
  );

  const propertiesContent = (
    <PropertiesPanel
      definition={state.definition}
      selectedElementId={state.selectedElementId}
      selectedElementType={state.selectedElementType}
      fieldDefinitions={fieldDefinitions}
      onUpdatePage={updatePage}
      onUpdateSection={updateSection}
      onUpdateField={updateField}
    />
  );

  const previewContent = (
    <FormPreview
      definition={state.definition}
      fieldDefinitions={fieldDefinitions}
      standalone={state.viewMode === "preview"}
      onClose={() => setViewMode("editor")}
    />
  );

  // ─── Full-screen preview mode ──────────────────────
  if (state.viewMode === "preview") {
    return (
      <div className="-m-4 md:-m-6 flex h-[calc(100vh-3rem)] flex-col">
        <DesignerToolbar
          formName={template.name}
          eventId={event.id}
          formId={template.id}
          viewMode={state.viewMode}
          canUndo={canUndo}
          canRedo={canRedo}
          autosaveStatus={status}
          lastSavedAt={lastSavedAt}
          onUndo={undo}
          onRedo={redo}
          onSetViewMode={setViewMode}
          onSaveNow={saveNow}
        />
        <div className="flex-1 overflow-hidden">{previewContent}</div>
      </div>
    );
  }

  return (
    <DndDesignerContext
      definition={state.definition}
      activePageId={state.activePageId}
      fieldDefinitions={fieldDefinitions}
      onMoveField={moveField}
      onReorderSections={reorderSections}
      onAddFieldFromPalette={handleAddFieldFromPalette}
    >
      <div className="-m-4 md:-m-6 flex h-[calc(100vh-3rem)] flex-col">
        <DesignerToolbar
          formName={template.name}
          eventId={event.id}
          formId={template.id}
          viewMode={state.viewMode}
          canUndo={canUndo}
          canRedo={canRedo}
          autosaveStatus={status}
          lastSavedAt={lastSavedAt}
          onUndo={undo}
          onRedo={redo}
          onSetViewMode={setViewMode}
          onSaveNow={saveNow}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Field palette (editor mode only) */}
          {state.viewMode === "editor" &&
            (isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon-sm" className="absolute left-2 top-14 z-10">
                    <PanelLeft className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Fields</SheetTitle>
                  </SheetHeader>
                  {paletteContent}
                </SheetContent>
              </Sheet>
            ) : (
              paletteContent
            ))}

          {/* Center: Design canvas */}
          <DesignCanvas
            definition={state.definition}
            activePageId={state.activePageId}
            selectedElementId={state.selectedElementId}
            selectedElementType={state.selectedElementType}
            fieldDefinitions={fieldDefinitions}
            onSelectElement={selectElement}
            onSetActivePage={setActivePage}
            onAddPage={handleAddPage}
            onRemovePage={removePage}
            onUpdatePage={updatePage}
            onDuplicatePage={handleDuplicatePage}
            onReorderPages={reorderPages}
            onAddSection={handleAddSection}
            onRemoveSection={removeSection}
            onUpdateSection={updateSection}
            onReorderSections={reorderSections}
            onRemoveField={removeField}
          />

          {/* Right panel: Split mode = preview, Editor mode = properties */}
          {state.viewMode === "split" ? (
            <div className="flex-1 border-l overflow-hidden">{previewContent}</div>
          ) : isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm" className="absolute right-2 top-14 z-10">
                  <PanelRight className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Properties</SheetTitle>
                </SheetHeader>
                {propertiesContent}
              </SheetContent>
            </Sheet>
          ) : (
            propertiesContent
          )}
        </div>
      </div>
    </DndDesignerContext>
  );
}
