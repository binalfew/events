import { useCallback } from "react";
import { Plus, Trash2, Diamond } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConditionEditor, type FieldOption } from "~/components/workflow-designer/condition-editor";
import type { VisibilityCondition } from "~/types/form-designer";
import type { ConditionalRoute } from "~/services/workflow-engine/serializer.server";

// ─── Types ────────────────────────────────────────────────

interface StepOption {
  id: string;
  name: string;
}

interface ConditionalRouteEditorProps {
  routes: ConditionalRoute[];
  onChange: (routes: ConditionalRoute[]) => void;
  fields: FieldOption[];
  steps: StepOption[];
  disabled?: boolean;
  title?: string;
}

// ─── Route Item ───────────────────────────────────────────

function RouteItem({
  route,
  onChange,
  onRemove,
  fields,
  steps,
  disabled,
}: {
  route: ConditionalRoute;
  onChange: (route: ConditionalRoute) => void;
  onRemove: () => void;
  fields: FieldOption[];
  steps: StepOption[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="size-4 text-amber-500" />
          <span className="text-sm font-medium">
            {route.label || `Route (Priority ${route.priority})`}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="size-7"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Label</Label>
          <Input
            value={route.label ?? ""}
            onChange={(e) => onChange({ ...route, label: e.target.value })}
            placeholder="e.g., VIP fast-track"
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-xs">Target Step</Label>
          <NativeSelect
            value={route.targetStepId}
            onChange={(e) => onChange({ ...route, targetStepId: e.target.value })}
            disabled={disabled}
          >
            <NativeSelectOption value="">Select step</NativeSelectOption>
            {steps.map((s) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {s.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label className="text-xs">Priority</Label>
          <Input
            type="number"
            min={1}
            value={route.priority}
            onChange={(e) => onChange({ ...route, priority: parseInt(e.target.value, 10) || 1 })}
            disabled={disabled}
          />
        </div>
      </div>

      <ConditionEditor
        condition={route.condition}
        onChange={(condition: VisibilityCondition | undefined) => {
          if (condition) {
            onChange({ ...route, condition });
          }
        }}
        fields={fields}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function ConditionalRouteEditor({
  routes,
  onChange,
  fields,
  steps,
  disabled,
  title = "Conditional Routes",
}: ConditionalRouteEditorProps) {
  const addRoute = useCallback(() => {
    const maxPriority = routes.reduce((max, r) => Math.max(max, r.priority), 0);
    const newRoute: ConditionalRoute = {
      id: crypto.randomUUID(),
      condition: { type: "simple", field: "", operator: "eq", value: "" },
      targetStepId: "",
      priority: maxPriority + 1,
    };
    onChange([...routes, newRoute]);
  }, [routes, onChange]);

  const updateRoute = useCallback(
    (index: number, updated: ConditionalRoute) => {
      const newRoutes = [...routes];
      newRoutes[index] = updated;
      onChange(newRoutes);
    },
    [routes, onChange],
  );

  const removeRoute = useCallback(
    (index: number) => {
      onChange(routes.filter((_, i) => i !== index));
    },
    [routes, onChange],
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Diamond className="size-4 text-amber-500" />
            {title}
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRoute} disabled={disabled}>
            <Plus className="mr-1 size-3" />
            Add route
          </Button>
        </div>
      </CardHeader>
      {routes.length > 0 && (
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          {routes
            .sort((a, b) => a.priority - b.priority)
            .map((route, index) => (
              <RouteItem
                key={route.id}
                route={route}
                onChange={(updated) => updateRoute(index, updated)}
                onRemove={() => removeRoute(index)}
                fields={fields}
                steps={steps}
                disabled={disabled}
              />
            ))}
          <p className="text-xs text-muted-foreground">
            Routes are evaluated in priority order (lowest first). The first matching condition
            determines the target step. If no condition matches, the default route is used.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
