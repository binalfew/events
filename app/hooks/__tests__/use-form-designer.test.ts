import { describe, it, expect } from "vitest";
import { designerReducer } from "../use-form-designer";
import type { DesignerState } from "~/types/designer-state";
import type {
  FormDefinition,
  FormPage,
  FormSection,
  FormFieldPlacement,
} from "~/types/form-designer";

function makeState(overrides: Partial<DesignerState> = {}): DesignerState {
  return {
    definition: { pages: [] },
    selectedElementId: null,
    selectedElementType: null,
    activePageId: null,
    viewMode: "editor",
    isDirty: false,
    ...overrides,
  };
}

function makePage(id = "page-1"): FormPage {
  return { id, title: `Page ${id}`, order: 0, sections: [] };
}

function makeSection(id = "section-1"): FormSection {
  return { id, title: `Section ${id}`, columns: 2, collapsible: false, order: 0, fields: [] };
}

function makeField(id = "field-1", defId = "fd-1"): FormFieldPlacement {
  return { id, fieldDefinitionId: defId, order: 0 };
}

describe("designerReducer", () => {
  // ─── SET_DEFINITION ─────────────────────────────────

  it("normalizes empty definition", () => {
    const state = makeState();
    const result = designerReducer(state, {
      type: "SET_DEFINITION",
      definition: undefined as unknown as FormDefinition,
    });
    expect(result.definition).toEqual({ pages: [] });
    expect(result.isDirty).toBe(false);
  });

  it("sets definition and resets selection", () => {
    const page = makePage("p1");
    const state = makeState({ selectedElementId: "old", selectedElementType: "field" });
    const result = designerReducer(state, {
      type: "SET_DEFINITION",
      definition: { pages: [page] },
    });
    expect(result.definition.pages).toHaveLength(1);
    expect(result.activePageId).toBe("p1");
    expect(result.selectedElementId).toBeNull();
  });

  // ─── SELECT_ELEMENT ─────────────────────────────────

  it("selects element", () => {
    const state = makeState();
    const result = designerReducer(state, {
      type: "SELECT_ELEMENT",
      elementId: "x",
      elementType: "field",
    });
    expect(result.selectedElementId).toBe("x");
    expect(result.selectedElementType).toBe("field");
  });

  it("deselects element", () => {
    const state = makeState({ selectedElementId: "x", selectedElementType: "field" });
    const result = designerReducer(state, {
      type: "SELECT_ELEMENT",
      elementId: null,
      elementType: null,
    });
    expect(result.selectedElementId).toBeNull();
    expect(result.selectedElementType).toBeNull();
  });

  // ─── SET_ACTIVE_PAGE ────────────────────────────────

  it("sets active page", () => {
    const state = makeState();
    const result = designerReducer(state, { type: "SET_ACTIVE_PAGE", pageId: "p2" });
    expect(result.activePageId).toBe("p2");
  });

  // ─── SET_VIEW_MODE ──────────────────────────────────

  it("sets view mode", () => {
    const state = makeState();
    const result = designerReducer(state, { type: "SET_VIEW_MODE", viewMode: "preview" });
    expect(result.viewMode).toBe("preview");
  });

  // ─── ADD_PAGE ───────────────────────────────────────

  it("adds page and sets active", () => {
    const state = makeState();
    const page = makePage("p1");
    const result = designerReducer(state, { type: "ADD_PAGE", page });
    expect(result.definition.pages).toHaveLength(1);
    expect(result.activePageId).toBe("p1");
    expect(result.isDirty).toBe(true);
  });

  // ─── REMOVE_PAGE ────────────────────────────────────

  it("removes page and falls back to first page", () => {
    const p1 = makePage("p1");
    const p2 = makePage("p2");
    const state = makeState({
      definition: { pages: [p1, p2] },
      activePageId: "p1",
    });
    const result = designerReducer(state, { type: "REMOVE_PAGE", pageId: "p1" });
    expect(result.definition.pages).toHaveLength(1);
    expect(result.activePageId).toBe("p2");
    expect(result.isDirty).toBe(true);
  });

  it("clears selection when removing selected page", () => {
    const p1 = makePage("p1");
    const state = makeState({
      definition: { pages: [p1] },
      activePageId: "p1",
      selectedElementId: "p1",
      selectedElementType: "page",
    });
    const result = designerReducer(state, { type: "REMOVE_PAGE", pageId: "p1" });
    expect(result.selectedElementId).toBeNull();
  });

  // ─── UPDATE_PAGE ────────────────────────────────────

  it("updates page title", () => {
    const p1 = makePage("p1");
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "UPDATE_PAGE",
      pageId: "p1",
      updates: { title: "New Title" },
    });
    expect(result.definition.pages[0].title).toBe("New Title");
    expect(result.isDirty).toBe(true);
  });

  it("returns same state for non-existent page update", () => {
    const state = makeState();
    const result = designerReducer(state, {
      type: "UPDATE_PAGE",
      pageId: "nope",
      updates: { title: "X" },
    });
    expect(result).toBe(state);
  });

  // ─── ADD_SECTION ────────────────────────────────────

  it("adds section to page", () => {
    const p1 = makePage("p1");
    const state = makeState({ definition: { pages: [p1] } });
    const section = makeSection("s1");
    const result = designerReducer(state, { type: "ADD_SECTION", pageId: "p1", section });
    expect(result.definition.pages[0].sections).toHaveLength(1);
    expect(result.isDirty).toBe(true);
  });

  // ─── REMOVE_SECTION ─────────────────────────────────

  it("removes section from page", () => {
    const section = makeSection("s1");
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "REMOVE_SECTION",
      pageId: "p1",
      sectionId: "s1",
    });
    expect(result.definition.pages[0].sections).toHaveLength(0);
    expect(result.isDirty).toBe(true);
  });

  // ─── UPDATE_SECTION ─────────────────────────────────

  it("updates section columns", () => {
    const section = makeSection("s1");
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "UPDATE_SECTION",
      pageId: "p1",
      sectionId: "s1",
      updates: { columns: 3 },
    });
    expect(result.definition.pages[0].sections[0].columns).toBe(3);
  });

  // ─── ADD_FIELD ──────────────────────────────────────

  it("adds field to section", () => {
    const section = makeSection("s1");
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });
    const field = makeField("f1");
    const result = designerReducer(state, {
      type: "ADD_FIELD",
      pageId: "p1",
      sectionId: "s1",
      field,
    });
    expect(result.definition.pages[0].sections[0].fields).toHaveLength(1);
    expect(result.isDirty).toBe(true);
  });

  // ─── REMOVE_FIELD ───────────────────────────────────

  it("removes field from section", () => {
    const field = makeField("f1");
    const section: FormSection = { ...makeSection("s1"), fields: [field] };
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "REMOVE_FIELD",
      pageId: "p1",
      sectionId: "s1",
      fieldId: "f1",
    });
    expect(result.definition.pages[0].sections[0].fields).toHaveLength(0);
  });

  it("clears selection when removing selected field", () => {
    const field = makeField("f1");
    const section: FormSection = { ...makeSection("s1"), fields: [field] };
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({
      definition: { pages: [p1] },
      selectedElementId: "f1",
      selectedElementType: "field",
    });
    const result = designerReducer(state, {
      type: "REMOVE_FIELD",
      pageId: "p1",
      sectionId: "s1",
      fieldId: "f1",
    });
    expect(result.selectedElementId).toBeNull();
  });

  // ─── UPDATE_FIELD ───────────────────────────────────

  it("updates field colSpan", () => {
    const field = makeField("f1");
    const section: FormSection = { ...makeSection("s1"), fields: [field] };
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "UPDATE_FIELD",
      pageId: "p1",
      sectionId: "s1",
      fieldId: "f1",
      updates: { colSpan: 6 },
    });
    expect(result.definition.pages[0].sections[0].fields[0].colSpan).toBe(6);
  });

  // ─── MOVE_FIELD ─────────────────────────────────────

  it("moves field between sections", () => {
    const f1 = makeField("f1");
    const f2 = makeField("f2", "fd-2");
    f2.order = 1;
    const s1: FormSection = { ...makeSection("s1"), fields: [f1, f2] };
    const s2: FormSection = { ...makeSection("s2"), fields: [] };
    const p1: FormPage = { ...makePage("p1"), sections: [s1, s2] };
    const state = makeState({ definition: { pages: [p1] } });

    const result = designerReducer(state, {
      type: "MOVE_FIELD",
      fromPageId: "p1",
      fromSectionId: "s1",
      toPageId: "p1",
      toSectionId: "s2",
      fieldId: "f1",
      newOrder: 0,
    });

    expect(result.definition.pages[0].sections[0].fields).toHaveLength(1);
    expect(result.definition.pages[0].sections[1].fields).toHaveLength(1);
    expect(result.definition.pages[0].sections[1].fields[0].id).toBe("f1");
  });

  // ─── UPDATE_SETTINGS ───────────────────────────────

  it("updates settings with defaults", () => {
    const state = makeState();
    const result = designerReducer(state, {
      type: "UPDATE_SETTINGS",
      settings: { submitButtonText: "Send" },
    });
    expect(result.definition.settings?.submitButtonText).toBe("Send");
    expect(result.definition.settings?.displayMode).toBe("wizard");
    expect(result.isDirty).toBe(true);
  });

  // ─── MARK_SAVED ─────────────────────────────────────

  it("marks as saved", () => {
    const state = makeState({ isDirty: true });
    const result = designerReducer(state, { type: "MARK_SAVED" });
    expect(result.isDirty).toBe(false);
  });

  // ─── REORDER_PAGES ─────────────────────────────────

  it("reorders pages and re-indexes order", () => {
    const p1 = { ...makePage("p1"), order: 0 };
    const p2 = { ...makePage("p2"), order: 1 };
    const p3 = { ...makePage("p3"), order: 2 };
    const state = makeState({ definition: { pages: [p1, p2, p3] } });
    const result = designerReducer(state, {
      type: "REORDER_PAGES",
      fromIndex: 0,
      toIndex: 2,
    });
    expect(result.definition.pages.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
    expect(result.definition.pages.map((p) => p.order)).toEqual([0, 1, 2]);
    expect(result.isDirty).toBe(true);
  });

  it("returns same state for invalid page reorder indices", () => {
    const p1 = makePage("p1");
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "REORDER_PAGES",
      fromIndex: 0,
      toIndex: 5,
    });
    expect(result).toBe(state);
  });

  it("returns same state when reorder fromIndex equals toIndex", () => {
    const p1 = makePage("p1");
    const p2 = makePage("p2");
    const state = makeState({ definition: { pages: [p1, p2] } });
    const result = designerReducer(state, {
      type: "REORDER_PAGES",
      fromIndex: 0,
      toIndex: 0,
    });
    expect(result).toBe(state);
  });

  // ─── REORDER_SECTIONS ─────────────────────────────

  it("reorders sections within a page and re-indexes order", () => {
    const s1: FormSection = { ...makeSection("s1"), order: 0 };
    const s2: FormSection = { ...makeSection("s2"), order: 1 };
    const s3: FormSection = { ...makeSection("s3"), order: 2 };
    const p1: FormPage = { ...makePage("p1"), sections: [s1, s2, s3] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "REORDER_SECTIONS",
      pageId: "p1",
      fromIndex: 2,
      toIndex: 0,
    });
    expect(result.definition.pages[0].sections.map((s) => s.id)).toEqual(["s3", "s1", "s2"]);
    expect(result.definition.pages[0].sections.map((s) => s.order)).toEqual([0, 1, 2]);
    expect(result.isDirty).toBe(true);
  });

  it("returns same state for invalid section reorder indices", () => {
    const s1 = makeSection("s1");
    const p1: FormPage = { ...makePage("p1"), sections: [s1] };
    const state = makeState({ definition: { pages: [p1] } });
    const result = designerReducer(state, {
      type: "REORDER_SECTIONS",
      pageId: "p1",
      fromIndex: 0,
      toIndex: 5,
    });
    expect(result).toBe(state);
  });

  it("returns same state for non-existent page in section reorder", () => {
    const state = makeState({ definition: { pages: [] } });
    const result = designerReducer(state, {
      type: "REORDER_SECTIONS",
      pageId: "nope",
      fromIndex: 0,
      toIndex: 1,
    });
    expect(result).toBe(state);
  });

  // ─── Immutability ───────────────────────────────────

  it("does not mutate original state", () => {
    const section = makeSection("s1");
    const p1: FormPage = { ...makePage("p1"), sections: [section] };
    const state = makeState({ definition: { pages: [p1] } });

    designerReducer(state, {
      type: "ADD_FIELD",
      pageId: "p1",
      sectionId: "s1",
      field: makeField("f1"),
    });

    expect(state.definition.pages[0].sections[0].fields).toHaveLength(0);
    expect(state.isDirty).toBe(false);
  });
});
