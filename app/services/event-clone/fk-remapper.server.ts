/**
 * FKRemapper — maps old IDs to new IDs and deep-walks JSON to replace them.
 */
export class FKRemapper {
  private idMap = new Map<string, string>();

  register(oldId: string, newId: string): void {
    this.idMap.set(oldId, newId);
  }

  remap(oldId: string | null | undefined): string | null {
    if (oldId == null) return null;
    return this.idMap.get(oldId) ?? null;
  }

  /**
   * Deep-walks an object/array, replacing any string values that match
   * a registered old ID with the corresponding new ID.
   * Returns a new object — does not mutate the input.
   */
  remapJson(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "string") {
      return this.idMap.has(obj) ? this.idMap.get(obj)! : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.remapJson(item));
    }

    if (typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.remapJson(value);
      }
      return result;
    }

    // numbers, booleans, etc. pass through
    return obj;
  }

  get stats(): { totalMappings: number } {
    return { totalMappings: this.idMap.size };
  }
}
