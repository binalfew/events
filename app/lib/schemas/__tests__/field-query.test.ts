import { describe, it, expect } from "vitest";
import { customFieldConditionSchema, participantSearchSchema } from "../field-query";

describe("customFieldConditionSchema", () => {
  it("accepts valid condition with eq operator", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "country",
      operator: "eq",
      value: "US",
    });
    expect(result.success).toBe(true);
  });

  it("accepts isNull operator without value", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "country",
      operator: "isNull",
    });
    expect(result.success).toBe(true);
  });

  it("accepts isNotNull operator without value", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "age",
      operator: "isNotNull",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid operator", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "country",
      operator: "invalid_op",
      value: "US",
    });
    expect(result.success).toBe(false);
  });

  it("rejects field name starting with uppercase", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "Country",
      operator: "eq",
      value: "US",
    });
    expect(result.success).toBe(false);
  });

  it("rejects field name with special characters", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "my-field",
      operator: "eq",
      value: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects field name starting with a digit", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "1field",
      operator: "eq",
      value: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects field name longer than 64 characters", () => {
    const result = customFieldConditionSchema.safeParse({
      field: "a".repeat(65),
      operator: "eq",
      value: "test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all 12 operators", () => {
    const operators = [
      "eq",
      "neq",
      "contains",
      "startsWith",
      "gt",
      "gte",
      "lt",
      "lte",
      "in",
      "notIn",
      "isNull",
      "isNotNull",
    ];
    for (const operator of operators) {
      const result = customFieldConditionSchema.safeParse({
        field: "test_field",
        operator,
        value: "val",
      });
      expect(result.success, `operator "${operator}" should be valid`).toBe(true);
    }
  });
});

describe("participantSearchSchema", () => {
  it("accepts valid input with defaults", () => {
    const result = participantSearchSchema.safeParse({ eventId: "evt-123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conditions).toEqual([]);
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
      expect(result.data.orderBy).toBe("createdAt");
      expect(result.data.orderDir).toBe("desc");
    }
  });

  it("accepts full valid input", () => {
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      conditions: [{ field: "country", operator: "eq", value: "US" }],
      limit: 100,
      offset: 50,
      orderBy: "lastName",
      orderDir: "asc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing eventId", () => {
    const result = participantSearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects limit greater than 200", () => {
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      limit: 201,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 conditions", () => {
    const conditions = Array.from({ length: 21 }, (_, i) => ({
      field: `field_${i}`,
      operator: "eq" as const,
      value: "val",
    }));
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      conditions,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid orderDir", () => {
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      orderDir: "sideways",
    });
    expect(result.success).toBe(false);
  });

  it("accepts custom field name as orderBy", () => {
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      orderBy: "custom_field",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid orderBy value", () => {
    const result = participantSearchSchema.safeParse({
      eventId: "evt-123",
      orderBy: "DROP TABLE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts standard column names as orderBy", () => {
    const columns = ["createdAt", "updatedAt", "firstName", "lastName", "email", "status"];
    for (const col of columns) {
      const result = participantSearchSchema.safeParse({
        eventId: "evt-123",
        orderBy: col,
      });
      expect(result.success, `orderBy "${col}" should be valid`).toBe(true);
    }
  });
});
