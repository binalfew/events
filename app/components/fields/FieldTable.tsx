import { useState } from "react";
import { Form, Link } from "react-router";
import type { FieldDefinition } from "~/generated/prisma/client";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatDataType } from "~/components/fields/+utils";
import { DeleteFieldDialog } from "~/components/fields/DeleteFieldDialog";

interface FieldTableProps {
  fields: FieldDefinition[];
  dataCounts: Record<string, number>;
  eventId?: string;
  readOnlyIds?: Set<string>;
}

export function FieldTable({ fields, dataCounts, eventId, readOnlyIds }: FieldTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    name: string;
  } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Searchable</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No fields defined yet.
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field, index) => {
              const isGlobal = readOnlyIds?.has(field.id);
              const editUrl = isGlobal
                ? `/admin/settings/fields/${field.id}`
                : eventId
                  ? `/admin/events/${eventId}/fields/${field.id}`
                  : `/admin/settings/fields/${field.id}`;
              return (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">
                    <span>{field.label}</span>
                    {isGlobal && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Global
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{field.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatDataType(field.dataType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {field.isRequired ? (
                      <span className="text-green-600" aria-label="Yes">
                        &#10003;
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label="No">
                        &mdash;
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {field.isSearchable ? (
                      <span className="text-green-600" aria-label="Yes">
                        &#10003;
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label="No">
                        &mdash;
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{field.entityType}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isGlobal ? (
                      <Link to={editUrl}>
                        <Button variant="ghost" size="xs">
                          View
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {/* Reorder buttons */}
                        {index > 0 && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="reorder" />
                            <input type="hidden" name="fieldId" value={field.id} />
                            <input type="hidden" name="direction" value="up" />
                            <Button type="submit" variant="ghost" size="icon-xs" title="Move up">
                              &#8593;
                            </Button>
                          </Form>
                        )}
                        {index < fields.length - 1 && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="reorder" />
                            <input type="hidden" name="fieldId" value={field.id} />
                            <input type="hidden" name="direction" value="down" />
                            <Button type="submit" variant="ghost" size="icon-xs" title="Move down">
                              &#8595;
                            </Button>
                          </Form>
                        )}
                        <Link to={editUrl}>
                          <Button variant="ghost" size="xs">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              id: field.id,
                              label: field.label,
                              name: field.name,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <DeleteFieldDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        field={deleteTarget}
        dataCount={deleteTarget ? (dataCounts[deleteTarget.id] ?? 0) : 0}
      />
    </>
  );
}
