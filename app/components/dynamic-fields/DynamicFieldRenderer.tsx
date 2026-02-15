import {
  getInputProps,
  getSelectProps,
  getTextareaProps,
  getCollectionProps,
} from "@conform-to/react";
import type { FieldMetadata } from "@conform-to/react";
import type { FieldDefinition } from "~/generated/prisma/client";
import { ConformField } from "~/components/ui/conform-field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { getFieldConfig } from "./types";

interface DynamicFieldRendererProps {
  fieldDef: FieldDefinition;
  meta: FieldMetadata<unknown>;
}

/**
 * Strips Conform's `key` from helper return objects to avoid TS2783
 * ("key is specified more than once") when spreading onto components.
 * The `key` is passed as a separate JSX prop for React reconciliation.
 */
function inputProps(meta: FieldMetadata<unknown>, opts: { type: string }) {
  const { key, ...rest } = getInputProps(meta, opts as Parameters<typeof getInputProps>[1]);
  return { key, props: rest };
}

function textareaProps(meta: FieldMetadata<unknown>) {
  const { key, ...rest } = getTextareaProps(meta);
  return { key, props: rest };
}

function selectPropsHelper(meta: FieldMetadata<unknown>) {
  const { key, ...rest } = getSelectProps(meta);
  return { key, props: rest };
}

export function DynamicFieldRenderer({ fieldDef, meta }: DynamicFieldRendererProps) {
  const config = getFieldConfig(fieldDef);

  switch (fieldDef.dataType) {
    case "TEXT": {
      const { key, props } = inputProps(meta, { type: "text" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input
            key={key}
            {...props}
            placeholder={config.placeholder}
            maxLength={config.maxLength}
            pattern={config.pattern}
          />
        </ConformField>
      );
    }

    case "LONG_TEXT": {
      const { key, props } = textareaProps(meta);
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Textarea key={key} {...props} rows={config.rows ?? 3} maxLength={config.maxLength} />
        </ConformField>
      );
    }

    case "NUMBER": {
      const { key, props } = inputProps(meta, { type: "number" });

      if (config.prefix || config.suffix) {
        return (
          <ConformField
            fieldId={meta.id}
            label={fieldDef.label}
            description={fieldDef.description}
            errors={meta.errors}
            required={fieldDef.isRequired}
          >
            <div className="flex rounded-md shadow-xs">
              {config.prefix && (
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  {config.prefix}
                </span>
              )}
              <Input
                key={key}
                {...props}
                min={config.min}
                max={config.max}
                step={config.step}
                placeholder={config.placeholder}
                className={`${
                  config.prefix && !config.suffix ? "rounded-l-none" : ""
                } ${config.suffix && !config.prefix ? "rounded-r-none" : ""} ${
                  config.prefix && config.suffix ? "rounded-none" : ""
                }`}
              />
              {config.suffix && (
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  {config.suffix}
                </span>
              )}
            </div>
          </ConformField>
        );
      }

      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input
            key={key}
            {...props}
            min={config.min}
            max={config.max}
            step={config.step}
            placeholder={config.placeholder}
          />
        </ConformField>
      );
    }

    case "BOOLEAN": {
      const { key, props } = inputProps(meta, { type: "checkbox" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
          inline
        >
          <input
            key={key}
            {...props}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
        </ConformField>
      );
    }

    case "DATE": {
      const { key, props } = inputProps(meta, { type: "date" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} min={config.minDate} max={config.maxDate} />
        </ConformField>
      );
    }

    case "DATETIME": {
      const { key, props } = inputProps(meta, { type: "datetime-local" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} min={config.minDate} max={config.maxDate} />
        </ConformField>
      );
    }

    case "ENUM": {
      const options = config.options ?? [];
      const { key, props } = selectPropsHelper(meta);
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <NativeSelect key={key} {...props} className="w-full">
            <NativeSelectOption value="">Select {fieldDef.label}...</NativeSelectOption>
            {options.map((opt) => (
              <NativeSelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </ConformField>
      );
    }

    case "MULTI_ENUM": {
      const options = config.options ?? [];
      const labelMap = new Map(options.map((o) => [o.value, o.label]));
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <div className="mt-1 space-y-2">
            {getCollectionProps(meta, {
              type: "checkbox",
              options: options.map((o) => o.value),
            }).map(({ key, ...checkboxProps }) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  {...checkboxProps}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground">
                  {labelMap.get(checkboxProps.value ?? "") ?? checkboxProps.value}
                </span>
              </label>
            ))}
          </div>
        </ConformField>
      );
    }

    case "EMAIL": {
      const { key, props } = inputProps(meta, { type: "email" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} placeholder={config.placeholder} />
        </ConformField>
      );
    }

    case "URL": {
      const { key, props } = inputProps(meta, { type: "url" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} placeholder={config.placeholder} />
        </ConformField>
      );
    }

    case "PHONE": {
      const { key, props } = inputProps(meta, { type: "tel" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} placeholder={config.placeholder} />
        </ConformField>
      );
    }

    case "FILE": {
      const { key, props } = inputProps(meta, { type: "file" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} accept={config.accept} />
        </ConformField>
      );
    }

    case "IMAGE": {
      const { key, props } = inputProps(meta, { type: "file" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} accept={config.accept ?? "image/*"} />
        </ConformField>
      );
    }

    case "REFERENCE": {
      const { key, props } = inputProps(meta, { type: "text" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} placeholder="Enter ID" />
        </ConformField>
      );
    }

    case "FORMULA":
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
        >
          <span className="mt-1 block text-sm text-muted-foreground italic">(Computed field)</span>
        </ConformField>
      );

    case "JSON": {
      const { key, props } = textareaProps(meta);
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Textarea key={key} {...props} rows={config.rows ?? 5} className="font-mono text-sm" />
        </ConformField>
      );
    }

    default: {
      const { key, props } = inputProps(meta, { type: "text" });
      return (
        <ConformField
          fieldId={meta.id}
          label={fieldDef.label}
          description={fieldDef.description}
          errors={meta.errors}
          required={fieldDef.isRequired}
        >
          <Input key={key} {...props} />
        </ConformField>
      );
    }
  }
}
