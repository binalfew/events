import { useState, useCallback, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";

// ─── Types ───────────────────────────────────────────────

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: string;
}

interface ValidationPreviewRow {
  rowNumber: number;
  status: "valid" | "warning" | "error";
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

interface TargetField {
  name: string;
  label: string;
  isRequired: boolean;
}

interface ImportWizardProps {
  eventId: string;
  targetFields: TargetField[];
  operationId?: string;
  operationStatus?: string;
  headers?: string[];
  mappings?: ColumnMapping[];
  preview?: ValidationPreviewRow[];
  validCount?: number;
  warningCount?: number;
  errorCount?: number;
  operation?: {
    id: string;
    status: string;
    totalItems: number;
    processedItems: number;
    successCount: number;
    failureCount: number;
    undoDeadline: string | null;
  };
}

type WizardStep = "upload" | "mapping" | "preview" | "processing" | "results";

// ─── Component ───────────────────────────────────────────

export function ImportWizard({
  eventId,
  targetFields,
  operationId: initialOperationId,
  operationStatus,
  headers: initialHeaders,
  mappings: initialMappings,
  preview: initialPreview,
  validCount: initialValid,
  warningCount: initialWarning,
  errorCount: initialError,
  operation: initialOperation,
}: ImportWizardProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  // Determine initial step from operation state
  const getInitialStep = (): WizardStep => {
    if (!initialOperationId) return "upload";
    if (operationStatus === "PREVIEW") return initialMappings ? "preview" : "mapping";
    if (operationStatus === "PROCESSING") return "processing";
    if (operationStatus === "COMPLETED" || operationStatus === "FAILED") return "results";
    return "upload";
  };

  const [step, setStep] = useState<WizardStep>(getInitialStep);
  const [operationId, setOperationId] = useState(initialOperationId ?? "");
  const [headers, setHeaders] = useState<string[]>(initialHeaders ?? []);
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings ?? []);
  const [preview, setPreview] = useState<ValidationPreviewRow[]>(initialPreview ?? []);
  const [validCount, setValidCount] = useState(initialValid ?? 0);
  const [warningCount, setWarningCount] = useState(initialWarning ?? 0);
  const [errorCount, setErrorCount] = useState(initialError ?? 0);
  const [skipErrors, setSkipErrors] = useState(false);
  const [operation, setOperation] = useState(initialOperation);

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as any;

      if (data.operationId && data.headers) {
        // Upload response
        setOperationId(data.operationId);
        setHeaders(data.headers);
        setMappings(data.mappings ?? []);
        setPreview(data.preview ?? []);
        setValidCount(data.validCount ?? 0);
        setWarningCount(data.warningCount ?? 0);
        setErrorCount(data.errorCount ?? 0);
        setStep("mapping");
      }

      if (data.validated) {
        setPreview(data.preview ?? []);
        setValidCount(data.validCount ?? 0);
        setWarningCount(data.warningCount ?? 0);
        setErrorCount(data.errorCount ?? 0);
        setStep("preview");
      }

      if (data.confirmed) {
        setStep("processing");
      }

      if (data.operation) {
        setOperation(data.operation);
        if (data.operation.status === "COMPLETED" || data.operation.status === "FAILED") {
          setStep("results");
        }
      }
    }
  }, [fetcher.data, fetcher.state]);

  // Poll during processing
  useEffect(() => {
    if (step !== "processing") return;
    const interval = setInterval(() => revalidator.revalidate(), 2000);
    return () => clearInterval(interval);
  }, [step, revalidator]);

  // Update from revalidation
  useEffect(() => {
    if (initialOperation && step === "processing") {
      setOperation(initialOperation);
      if (initialOperation.status === "COMPLETED" || initialOperation.status === "FAILED") {
        setStep("results");
      }
    }
  }, [initialOperation, step]);

  const isSubmitting = fetcher.state !== "idle";

  const steps: { key: WizardStep; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "mapping", label: "Column Mapping" },
    { key: "preview", label: "Validation" },
    { key: "processing", label: "Processing" },
    { key: "results", label: "Results" },
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : steps.findIndex((x) => x.key === step) > i
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              }`}
            >
              <span>{i + 1}</span>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Step 1: Upload */}
      {step === "upload" && (
        <UploadStep eventId={eventId} fetcher={fetcher} isSubmitting={isSubmitting} />
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && (
        <MappingStep
          headers={headers}
          mappings={mappings}
          targetFields={targetFields}
          onUpdateMappings={setMappings}
          onConfirm={() => {
            fetcher.submit(
              {
                _action: "updateMappings",
                operationId,
                mappings: JSON.stringify(mappings),
              },
              { method: "POST" },
            );
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Step 3: Validation Preview */}
      {step === "preview" && (
        <PreviewStep
          preview={preview}
          validCount={validCount}
          warningCount={warningCount}
          errorCount={errorCount}
          skipErrors={skipErrors}
          onSkipErrorsChange={setSkipErrors}
          onConfirm={() => {
            fetcher.submit(
              { _action: "confirm", operationId, skipErrors: String(skipErrors) },
              { method: "POST" },
            );
          }}
          onCancel={() => {
            fetcher.submit({ _action: "cancel", operationId }, { method: "POST" });
            setStep("upload");
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Step 4: Processing */}
      {step === "processing" && <ProcessingStep operation={operation} />}

      {/* Step 5: Results */}
      {step === "results" && (
        <ResultsStep
          operation={operation}
          onUndo={() => {
            fetcher.submit(
              { _action: "undo", operationId: operation?.id ?? operationId },
              { method: "POST" },
            );
          }}
          onNewImport={() => {
            setStep("upload");
            setOperationId("");
            setHeaders([]);
            setMappings([]);
            setPreview([]);
            setOperation(undefined);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ─── Upload Step ─────────────────────────────────────────

function UploadStep({
  eventId,
  fetcher,
  isSubmitting,
}: {
  eventId: string;
  fetcher: ReturnType<typeof useFetcher>;
  isSubmitting: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        const formData = new FormData();
        formData.set("_action", "upload");
        formData.set("eventId", eventId);
        formData.set("file", file);
        formData.set("description", `Import from ${file.name}`);
        fetcher.submit(formData, { method: "POST", encType: "multipart/form-data" });
      }
    },
    [eventId, fetcher],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
      </CardHeader>
      <CardContent>
        <fetcher.Form method="POST" encType="multipart/form-data">
          <input type="hidden" name="_action" value="upload" />
          <input type="hidden" name="eventId" value={eventId} />

          <div
            className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <p className="text-sm text-muted-foreground">Drag and drop a CSV or XLSX file, or</p>
            <div className="mt-3 flex flex-col items-center gap-3">
              <Input
                type="file"
                name="file"
                accept=".csv,.xlsx,.xls"
                className="w-auto"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFileName(file.name);
                }}
              />
              {fileName && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    name="description"
                    defaultValue={`Import from ${fileName}`}
                    className="w-80"
                  />
                </div>
              )}
            </div>
          </div>

          {fileName && (
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload & Validate"}
              </Button>
            </div>
          )}
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

// ─── Mapping Step ────────────────────────────────────────

function MappingStep({
  headers,
  mappings,
  targetFields,
  onUpdateMappings,
  onConfirm,
  isSubmitting,
}: {
  headers: string[];
  mappings: ColumnMapping[];
  targetFields: { name: string; label: string; isRequired: boolean }[];
  onUpdateMappings: (mappings: ColumnMapping[]) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const updateMapping = (sourceColumn: string, targetField: string) => {
    const updated = mappings.filter((m) => m.sourceColumn !== sourceColumn);
    if (targetField) {
      updated.push({ sourceColumn, targetField });
    }
    onUpdateMappings(updated);
  };

  const unmappedHeaders = headers.filter((h) => !mappings.some((m) => m.sourceColumn === h));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Map your file columns to participant fields. Required fields are marked with *.
        </p>

        <div className="space-y-3">
          {headers.map((header) => {
            const mapping = mappings.find((m) => m.sourceColumn === header);
            const isMapped = !!mapping;

            return (
              <div
                key={header}
                className={`flex items-center gap-4 rounded-md border p-3 ${
                  !isMapped ? "border-yellow-300 bg-yellow-50" : ""
                }`}
              >
                <div className="w-48 truncate text-sm font-medium">{header}</div>
                <div className="text-muted-foreground">→</div>
                <NativeSelect
                  className="w-64"
                  value={mapping?.targetField ?? ""}
                  onChange={(e) => updateMapping(header, e.target.value)}
                >
                  <NativeSelectOption value="">-- Skip this column --</NativeSelectOption>
                  {targetFields.map((f) => (
                    <NativeSelectOption key={f.name} value={f.name}>
                      {f.label}
                      {f.isRequired ? " *" : ""}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            );
          })}
        </div>

        {unmappedHeaders.length > 0 && (
          <p className="text-xs text-yellow-600">
            {unmappedHeaders.length} column{unmappedHeaders.length !== 1 ? "s" : ""} not mapped
            (highlighted). Unmapped columns will be skipped.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Validating..." : "Validate Rows"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Preview Step ────────────────────────────────────────

function PreviewStep({
  preview,
  validCount,
  warningCount,
  errorCount,
  skipErrors,
  onSkipErrorsChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  preview: ValidationPreviewRow[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  skipErrors: boolean;
  onSkipErrorsChange: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{validCount}</div>
            <div className="text-xs text-green-600">Valid</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{errorCount}</div>
            <div className="text-xs text-red-600">Errors</div>
          </div>
        </div>

        {/* Row preview table */}
        {preview.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Row</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="py-2 pr-4">{row.rowNumber}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        className={
                          row.status === "valid"
                            ? "bg-green-100 text-green-800"
                            : row.status === "warning"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {row.errors.map((e) => (
                        <span key={e.field} className="mr-2 text-red-600">
                          {e.field}: {e.message}
                        </span>
                      ))}
                      {row.warnings.map((w) => (
                        <span key={w.field} className="mr-2 text-yellow-600">
                          {w.field}: {w.message}
                        </span>
                      ))}
                      {row.errors.length === 0 && row.warnings.length === 0 && "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {errorCount > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipErrors}
              onChange={(e) => onSkipErrorsChange(e.target.checked)}
              className="rounded"
            />
            Skip {errorCount} error row{errorCount !== 1 ? "s" : ""} and import valid rows only
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || (validCount === 0 && warningCount === 0)}
          >
            {isSubmitting ? "Processing..." : `Import ${validCount + warningCount} Rows`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Processing Step ─────────────────────────────────────

function ProcessingStep({
  operation,
}: {
  operation?: {
    totalItems: number;
    processedItems: number;
    successCount: number;
    failureCount: number;
  };
}) {
  const total = operation?.totalItems ?? 0;
  const processed = operation?.processedItems ?? 0;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {processed} of {total} rows processed
          </span>
          <span className="font-medium">{pct}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {operation && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="text-green-600">{operation.successCount} imported</span>
            {operation.failureCount > 0 && (
              <span className="text-red-600">{operation.failureCount} failed</span>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground animate-pulse">Refreshing every 2 seconds...</p>
      </CardContent>
    </Card>
  );
}

// ─── Results Step ────────────────────────────────────────

function ResultsStep({
  operation,
  onUndo,
  onNewImport,
  isSubmitting,
}: {
  operation?: {
    id: string;
    status: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    undoDeadline: string | null;
  };
  onUndo: () => void;
  onNewImport: () => void;
  isSubmitting: boolean;
}) {
  const canUndo =
    operation?.status === "COMPLETED" &&
    operation.undoDeadline &&
    new Date(operation.undoDeadline) > new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {operation?.status === "COMPLETED" ? "Import Complete" : "Import Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <div className="text-2xl font-bold">{operation?.totalItems ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Rows</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{operation?.successCount ?? 0}</div>
            <div className="text-xs text-green-600">Imported</div>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{operation?.failureCount ?? 0}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
        </div>

        {operation?.status === "ROLLED_BACK" && (
          <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
            This operation has been rolled back.
          </div>
        )}

        {canUndo && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm">
            <p className="text-yellow-800">
              You can undo this import within 24 hours (until{" "}
              {new Date(operation!.undoDeadline!).toLocaleString()}).
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {canUndo && (
            <Button variant="outline" onClick={onUndo} disabled={isSubmitting}>
              {isSubmitting ? "Undoing..." : "Undo Import"}
            </Button>
          )}
          <Button onClick={onNewImport}>New Import</Button>
        </div>
      </CardContent>
    </Card>
  );
}
