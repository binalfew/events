import { describe, it, expect } from "vitest";
import {
  fieldNameSchema,
  createFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
} from "../field";

describe("field schemas", () => {
  describe("fieldNameSchema", () => {
    it("accepts valid snake_case names", () => {
      expect(fieldNameSchema.safeParse("first_name").success).toBe(true);
      expect(fieldNameSchema.safeParse("age").success).toBe(true);
      expect(fieldNameSchema.safeParse("field123").success).toBe(true);
      expect(fieldNameSchema.safeParse("a").success).toBe(true);
      expect(fieldNameSchema.safeParse("my_custom_field_1").success).toBe(true);
    });

    it("rejects names starting with uppercase", () => {
      expect(fieldNameSchema.safeParse("FirstName").success).toBe(false);
    });

    it("rejects names starting with a digit", () => {
      expect(fieldNameSchema.safeParse("1field").success).toBe(false);
    });

    it("rejects names starting with underscore", () => {
      expect(fieldNameSchema.safeParse("_field").success).toBe(false);
    });

    it("rejects names with spaces", () => {
      expect(fieldNameSchema.safeParse("first name").success).toBe(false);
    });

    it("rejects names with hyphens", () => {
      expect(fieldNameSchema.safeParse("first-name").success).toBe(false);
    });

    it("rejects empty string", () => {
      expect(fieldNameSchema.safeParse("").success).toBe(false);
    });

    it("rejects names exceeding 64 characters", () => {
      expect(fieldNameSchema.safeParse("a".repeat(65)).success).toBe(false);
      expect(fieldNameSchema.safeParse("a".repeat(64)).success).toBe(true);
    });
  });

  describe("createFieldSchema", () => {
    const validInput = {
      eventId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      name: "country_code",
      label: "Country Code",
      dataType: "TEXT",
    };

    it("accepts valid input with minimal fields", () => {
      const result = createFieldSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityType).toBe("Participant");
        expect(result.data.isRequired).toBe(false);
        expect(result.data.isUnique).toBe(false);
        expect(result.data.isSearchable).toBe(false);
        expect(result.data.isFilterable).toBe(false);
        expect(result.data.config).toEqual({});
        expect(result.data.validation).toEqual([]);
      }
    });

    it("accepts all 16 valid dataType values", () => {
      const dataTypes = [
        "TEXT",
        "LONG_TEXT",
        "NUMBER",
        "BOOLEAN",
        "DATE",
        "DATETIME",
        "ENUM",
        "MULTI_ENUM",
        "EMAIL",
        "URL",
        "PHONE",
        "FILE",
        "IMAGE",
        "REFERENCE",
        "FORMULA",
        "JSON",
      ];
      for (const dataType of dataTypes) {
        const result = createFieldSchema.safeParse({ ...validInput, dataType });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid dataType values", () => {
      expect(createFieldSchema.safeParse({ ...validInput, dataType: "COUNTRY" }).success).toBe(
        false,
      );
      expect(createFieldSchema.safeParse({ ...validInput, dataType: "USER" }).success).toBe(false);
      expect(createFieldSchema.safeParse({ ...validInput, dataType: "INVALID" }).success).toBe(
        false,
      );
    });

    it("accepts both entity types", () => {
      expect(
        createFieldSchema.safeParse({ ...validInput, entityType: "Participant" }).success,
      ).toBe(true);
      expect(createFieldSchema.safeParse({ ...validInput, entityType: "Event" }).success).toBe(
        true,
      );
    });

    it("rejects invalid entity types", () => {
      expect(createFieldSchema.safeParse({ ...validInput, entityType: "Workflow" }).success).toBe(
        false,
      );
    });

    it("allows optional eventId (global fields)", () => {
      const { eventId: _, ...withoutEventId } = validInput;
      expect(createFieldSchema.safeParse(withoutEventId).success).toBe(true);
    });

    it("requires name", () => {
      const { name: _, ...withoutName } = validInput;
      expect(createFieldSchema.safeParse(withoutName).success).toBe(false);
    });

    it("requires label", () => {
      const { label: _, ...withoutLabel } = validInput;
      expect(createFieldSchema.safeParse(withoutLabel).success).toBe(false);
    });

    it("accepts optional participantTypeId", () => {
      const result = createFieldSchema.safeParse({
        ...validInput,
        participantTypeId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional description", () => {
      const result = createFieldSchema.safeParse({
        ...validInput,
        description: "A description",
      });
      expect(result.success).toBe(true);
    });

    it("accepts config as a record", () => {
      const result = createFieldSchema.safeParse({
        ...validInput,
        config: { options: ["a", "b"] },
      });
      expect(result.success).toBe(true);
    });

    it("accepts validation as an array of records", () => {
      const result = createFieldSchema.safeParse({
        ...validInput,
        validation: [
          { type: "min", value: 0 },
          { type: "max", value: 100 },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateFieldSchema", () => {
    it("allows partial updates", () => {
      const result = updateFieldSchema.safeParse({ label: "New Label" });
      expect(result.success).toBe(true);
    });

    it("allows empty object (no changes)", () => {
      const result = updateFieldSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("does not accept eventId", () => {
      const result = updateFieldSchema.safeParse({ eventId: "clxxxxxxxxxxxxxxxxxxxxxxxxx" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect("eventId" in result.data).toBe(false);
      }
    });

    it("validates name if provided", () => {
      expect(updateFieldSchema.safeParse({ name: "Valid_name" }).success).toBe(false);
      expect(updateFieldSchema.safeParse({ name: "valid_name" }).success).toBe(true);
    });
  });

  describe("reorderFieldsSchema", () => {
    it("accepts an array of CUID strings", () => {
      const result = reorderFieldsSchema.safeParse({
        fieldIds: ["clxxxxxxxxxxxxxxxxxxxxxxxxx", "clyyyyyyyyyyyyyyyyyyyyyyyy"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty array", () => {
      expect(reorderFieldsSchema.safeParse({ fieldIds: [] }).success).toBe(false);
    });

    it("rejects missing fieldIds", () => {
      expect(reorderFieldsSchema.safeParse({}).success).toBe(false);
    });

    it("rejects non-CUID strings", () => {
      expect(reorderFieldsSchema.safeParse({ fieldIds: ["not-a-cuid"] }).success).toBe(false);
    });
  });
});
