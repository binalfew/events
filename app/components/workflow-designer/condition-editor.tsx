import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getOperatorsForType } from "~/lib/condition-evaluator";
import type {
  VisibilityCondition,
  SimpleCondition,
  CompoundCondition,
  ConditionOperator,
} from "~/types/form-designer";

// ─── Types ────────────────────────────────────────────────

export interface FieldOption {
  name: string;
  label: string;
  dataType: string;
  options?: Array<{ value: string; label: string }>;
}

interface ConditionEditorProps {
  condition?: VisibilityCondition;
  onChange: (condition: VisibilityCondition | undefined) => void;
  fields: FieldOption[];
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────

function createSimpleCondition(fieldName?: string): SimpleCondition {
  return {
    type: "simple",
    field: fieldName ?? "",
    operator: "eq",
    value: "",
  };
}

function createCompoundCondition(operator: "and" | "or" = "and"): CompoundCondition {
  return {
    type: "compound",
    operator,
    conditions: [createSimpleCondition()],
  };
}

function conditionToReadable(condition: VisibilityCondition, fields: FieldOption[]): string {
  if (condition.type === "simple") {
    const field = fields.find((f) => f.name === condition.field);
    const fieldLabel = field?.label ?? condition.field;
    const operators = getOperatorsForType(field?.dataType ?? "TEXT");
    const opLabel =
      operators.find((o) => o.value === condition.operator)?.label ?? condition.operator;
    const needsValue = operators.find((o) => o.value === condition.operator)?.needsValue;
    if (!needsValue) return `${fieldLabel} ${opLabel}`;
    return `${fieldLabel} ${opLabel} "${condition.value}"`;
  }

  const parts = condition.conditions.map((c) => conditionToReadable(c, fields));
  const joiner = condition.operator === "and" ? " AND " : " OR ";
  return parts.join(joiner);
}

// ─── Simple Condition Row ─────────────────────────────────

function SimpleConditionRow({
  condition,
  onChange,
  onRemove,
  fields,
  disabled,
}: {
  condition: SimpleCondition;
  onChange: (c: SimpleCondition) => void;
  onRemove?: () => void;
  fields: FieldOption[];
  disabled?: boolean;
}) {
  const selectedField = fields.find((f) => f.name === condition.field);
  const operators = getOperatorsForType(selectedField?.dataType ?? "TEXT");
  const currentOp = operators.find((o) => o.value === condition.operator);
  const needsValue = currentOp?.needsValue ?? true;

  return (
    <div className="flex items-center gap-2">
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />

      {/* Field selector */}
      <NativeSelect
        value={condition.field}
        onChange={(e) =>
          onChange({ ...condition, field: e.target.value, operator: "eq", value: "" })
        }
        disabled={disabled}
        className="w-40"
      >
        <NativeSelectOption value="">Select field</NativeSelectOption>
        {fields.map((f) => (
          <NativeSelectOption key={f.name} value={f.name}>
            {f.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {/* Operator selector */}
      <NativeSelect
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as ConditionOperator })}
        disabled={disabled || !condition.field}
        className="w-36"
      >
        {operators.map((op) => (
          <NativeSelectOption key={op.value} value={op.value}>
            {op.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {/* Value input */}
      {needsValue && (
        <>
          {selectedField?.options ? (
            <NativeSelect
              value={String(condition.value ?? "")}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              disabled={disabled}
              className="w-40"
            >
              <NativeSelectOption value="">Value</NativeSelectOption>
              {selectedField.options.map((opt) => (
                <NativeSelectOption key={opt.value} value={opt.value}>
                  {opt.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : (
            <Input
              value={String(condition.value ?? "")}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder="Value"
              className="w-40"
              disabled={disabled}
            />
          )}
        </>
      )}

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

// ─── Compound Condition Editor ────────────────────────────

function CompoundConditionEditor({
  condition,
  onChange,
  fields,
  disabled,
}: {
  condition: CompoundCondition;
  onChange: (c: CompoundCondition) => void;
  fields: FieldOption[];
  disabled?: boolean;
}) {
  const addCondition = useCallback(() => {
    onChange({
      ...condition,
      conditions: [...condition.conditions, createSimpleCondition()],
    });
  }, [condition, onChange]);

  const updateCondition = useCallback(
    (index: number, updated: VisibilityCondition) => {
      const newConditions = [...condition.conditions];
      newConditions[index] = updated;
      onChange({ ...condition, conditions: newConditions });
    },
    [condition, onChange],
  );

  const removeCondition = useCallback(
    (index: number) => {
      const newConditions = condition.conditions.filter((_, i) => i !== index);
      onChange({ ...condition, conditions: newConditions });
    },
    [condition, onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Match</Label>
        <NativeSelect
          value={condition.operator}
          onChange={(e) => onChange({ ...condition, operator: e.target.value as "and" | "or" })}
          disabled={disabled}
          className="w-24"
        >
          <NativeSelectOption value="and">ALL</NativeSelectOption>
          <NativeSelectOption value="or">ANY</NativeSelectOption>
        </NativeSelect>
        <Label className="text-xs text-muted-foreground">of the following conditions</Label>
      </div>

      <div className="space-y-2 pl-4 border-l-2 border-muted">
        {condition.conditions.map((c, index) => {
          if (c.type === "simple") {
            return (
              <SimpleConditionRow
                key={index}
                condition={c}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={
                  condition.conditions.length > 1 ? () => removeCondition(index) : undefined
                }
                fields={fields}
                disabled={disabled}
              />
            );
          }
          return null;
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCondition}
        disabled={disabled}
        className="ml-4"
      >
        <Plus className="mr-1 size-3" />
        Add condition
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function ConditionEditor({ condition, onChange, fields, disabled }: ConditionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(!!condition);

  const handleEnable = useCallback(() => {
    setIsExpanded(true);
    if (!condition) {
      onChange(createCompoundCondition());
    }
  }, [condition, onChange]);

  const handleClear = useCallback(() => {
    setIsExpanded(false);
    onChange(undefined);
  }, [onChange]);

  // Normalize: wrap simple conditions in a compound wrapper for the editor
  const normalizedCondition: CompoundCondition | undefined = condition
    ? condition.type === "compound"
      ? condition
      : { type: "compound", operator: "and", conditions: [condition] }
    : undefined;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Conditions</CardTitle>
          {isExpanded ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
            >
              Clear
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnable}
              disabled={disabled}
            >
              <Plus className="mr-1 size-3" />
              Add conditions
            </Button>
          )}
        </div>
      </CardHeader>
      {isExpanded && normalizedCondition && (
        <CardContent className="px-4 pb-4 pt-0">
          <CompoundConditionEditor
            condition={normalizedCondition}
            onChange={onChange}
            fields={fields}
            disabled={disabled}
          />
          {/* Preview */}
          {normalizedCondition.conditions.length > 0 &&
            normalizedCondition.conditions[0].type === "simple" &&
            normalizedCondition.conditions[0].field && (
              <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium">Preview: </span>
                {conditionToReadable(normalizedCondition, fields)}
              </div>
            )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Exports ──────────────────────────────────────────────

export { conditionToReadable, createSimpleCondition, createCompoundCondition };
export type { ConditionEditorProps };
