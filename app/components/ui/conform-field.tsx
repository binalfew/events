import { Label } from "~/components/ui/label";

interface ConformFieldProps {
  fieldId: string;
  label: string;
  description?: string | null;
  errors?: string[];
  required?: boolean;
  inline?: boolean;
  children: React.ReactNode;
}

export function ConformField({
  fieldId,
  label,
  description,
  errors,
  required,
  inline,
  children,
}: ConformFieldProps) {
  if (inline) {
    return (
      <div>
        <div className="flex items-center gap-2">
          {children}
          <Label htmlFor={fieldId}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
        {description && (
          <p id={`${fieldId}-description`} className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {errors && errors.length > 0 && (
          <p id={`${fieldId}-error`} className="mt-1 text-sm text-destructive">
            {errors[0]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p id={`${fieldId}-description`} className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {children}
      {errors && errors.length > 0 && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-destructive">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
