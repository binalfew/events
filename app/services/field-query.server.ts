import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { FieldError } from "~/services/fields.server";
import { STANDARD_ORDER_COLUMNS } from "~/lib/schemas/field-query";
import type { ParticipantSearchInput } from "~/lib/schemas/field-query";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FieldDefinitionLike {
  id?: string;
  name: string;
  entityType: string;
  dataType: string;
  isSearchable: boolean;
  isFilterable: boolean;
}

const FIELD_NAME_REGEX = /^[a-z][a-z0-9_]*$/;

function assertValidFieldName(name: string): void {
  if (!FIELD_NAME_REGEX.test(name)) {
    throw new FieldError(`Invalid field name: "${name}"`, 400);
  }
}

function getTableName(entityType: string): string {
  switch (entityType) {
    case "Participant":
      return "Participant";
    case "Event":
      return "Event";
    default:
      throw new FieldError(`Unknown entity type: "${entityType}"`, 400);
  }
}

function getSqlCastForType(dataType: string): string {
  switch (dataType) {
    case "NUMBER":
      return "::NUMERIC";
    case "BOOLEAN":
      return "::BOOLEAN";
    case "DATE":
      return "::DATE";
    case "DATETIME":
      return "::TIMESTAMPTZ";
    default:
      return "";
  }
}

function getIndexName(table: string, field: string): string {
  return `idx_${table}_cf_${field}`;
}

interface FilterParams extends ParticipantSearchInput {
  tenantId: string;
}

export async function filterWithFields(
  params: FilterParams,
): Promise<{ data: unknown[]; total: number }> {
  const { tenantId, eventId, conditions, limit, offset, orderBy, orderDir } = params;

  // Load field definitions for validation
  const fieldDefs = await prisma.fieldDefinition.findMany({
    where: { tenantId, eventId, entityType: "Participant" },
  });
  const fieldMap = new Map(fieldDefs.map((f) => [f.name, f]));

  // Build parameterized WHERE clause
  const whereClauses: string[] = [`"tenantId" = $1`, `"eventId" = $2`, `"deletedAt" IS NULL`];
  const queryParams: unknown[] = [tenantId, eventId];
  let paramIndex = 3;

  for (const condition of conditions) {
    assertValidFieldName(condition.field);

    const fieldDef = fieldMap.get(condition.field);
    if (!fieldDef) {
      throw new FieldError(`Unknown field: "${condition.field}"`, 400);
    }

    const cast = getSqlCastForType(fieldDef.dataType);
    const extrasPath = `("extras"->>'${condition.field}')`;
    const castedPath = cast ? `(${extrasPath}${cast})` : extrasPath;

    switch (condition.operator) {
      case "eq":
        whereClauses.push(`${castedPath} = $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "neq":
        whereClauses.push(`${castedPath} <> $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "contains":
        whereClauses.push(`${extrasPath} ILIKE $${paramIndex}`);
        queryParams.push(`%${condition.value}%`);
        paramIndex++;
        break;
      case "startsWith":
        whereClauses.push(`${extrasPath} ILIKE $${paramIndex}`);
        queryParams.push(`${condition.value}%`);
        paramIndex++;
        break;
      case "gt":
        whereClauses.push(`${castedPath} > $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "gte":
        whereClauses.push(`${castedPath} >= $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "lt":
        whereClauses.push(`${castedPath} < $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "lte":
        whereClauses.push(`${castedPath} <= $${paramIndex}`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "in":
        whereClauses.push(`${castedPath} = ANY($${paramIndex})`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "notIn":
        whereClauses.push(`${castedPath} <> ALL($${paramIndex})`);
        queryParams.push(condition.value);
        paramIndex++;
        break;
      case "isNull":
        whereClauses.push(`("extras" ? '${condition.field}') = false`);
        break;
      case "isNotNull":
        whereClauses.push(`("extras" ? '${condition.field}') = true`);
        break;
    }
  }

  const whereSQL = whereClauses.join(" AND ");

  // Build ORDER BY
  let orderSQL: string;
  const isStandardColumn = (STANDARD_ORDER_COLUMNS as readonly string[]).includes(orderBy);
  if (isStandardColumn) {
    orderSQL = `"${orderBy}" ${orderDir}`;
  } else {
    assertValidFieldName(orderBy);
    const orderField = fieldMap.get(orderBy);
    const orderCast = orderField ? getSqlCastForType(orderField.dataType) : "";
    const orderExpr = orderCast
      ? `(("extras"->>'${orderBy}')${orderCast})`
      : `("extras"->>'${orderBy}')`;
    orderSQL = `${orderExpr} ${orderDir} NULLS LAST`;
  }

  // Execute count query
  const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "Participant" WHERE ${whereSQL}`,
    ...queryParams,
  );
  const total = countResult[0] ? Number(countResult[0].count) : 0;

  // Execute data query
  const data = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT * FROM "Participant" WHERE ${whereSQL} ORDER BY ${orderSQL} LIMIT ${limit} OFFSET ${offset}`,
    ...queryParams,
  );

  return { data, total };
}

export async function ensureFieldIndex(
  fieldDef: FieldDefinitionLike,
  ctx: ServiceContext,
): Promise<{ action: string; indexName: string }> {
  if (!fieldDef.isSearchable && !fieldDef.isFilterable) {
    return { action: "skipped", indexName: "" };
  }

  const table = getTableName(fieldDef.entityType);
  const indexName = getIndexName(table, fieldDef.name);
  const cast = getSqlCastForType(fieldDef.dataType);
  const expr = cast
    ? `(("extras"->>'${fieldDef.name}')${cast})`
    : `("extras"->>'${fieldDef.name}')`;

  const ddl = `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}" ON "${table}" (${expr}) WHERE "deletedAt" IS NULL`;

  try {
    await prisma.$executeRawUnsafe(ddl);

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "FieldIndex",
        entityId: fieldDef.id ?? indexName,
        description: `Created expression index "${indexName}" on ${table}`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { indexName, table, fieldName: fieldDef.name, dataType: fieldDef.dataType },
      },
    });

    logger.info({ indexName, table, field: fieldDef.name }, "Expression index created");
    return { action: "created", indexName };
  } catch (err) {
    logger.error(
      { err, indexName, table, field: fieldDef.name },
      "Failed to create expression index",
    );
    return { action: "error", indexName };
  }
}

export async function dropFieldIndex(
  fieldDef: FieldDefinitionLike,
  ctx: ServiceContext,
): Promise<{ action: string; indexName: string }> {
  const table = getTableName(fieldDef.entityType);
  const indexName = getIndexName(table, fieldDef.name);

  const ddl = `DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`;

  try {
    await prisma.$executeRawUnsafe(ddl);

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "DELETE",
        entityType: "FieldIndex",
        entityId: fieldDef.id ?? indexName,
        description: `Dropped expression index "${indexName}" on ${table}`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { indexName, table, fieldName: fieldDef.name },
      },
    });

    logger.info({ indexName, table, field: fieldDef.name }, "Expression index dropped");
    return { action: "dropped", indexName };
  } catch (err) {
    logger.error(
      { err, indexName, table, field: fieldDef.name },
      "Failed to drop expression index",
    );
    return { action: "error", indexName };
  }
}

export async function reconcileFieldIndexes(
  tenantId: string,
  ctx: ServiceContext,
): Promise<{ created: string[]; dropped: string[]; unchanged: string[] }> {
  const fieldDefs = await prisma.fieldDefinition.findMany({
    where: { tenantId },
  });

  // Get existing expression indexes for custom fields
  const existingIndexes = await prisma.$queryRawUnsafe<{ indexname: string }[]>(
    `SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%_cf_%'`,
  );
  const existingSet = new Set(existingIndexes.map((r) => r.indexname));

  const created: string[] = [];
  const dropped: string[] = [];
  const unchanged: string[] = [];

  // Determine expected indexes
  const expectedIndexes = new Map<string, FieldDefinitionLike>();
  for (const fd of fieldDefs) {
    if (fd.isSearchable || fd.isFilterable) {
      const table = getTableName(fd.entityType);
      const indexName = getIndexName(table, fd.name);
      expectedIndexes.set(indexName, fd);
    }
  }

  // Create missing indexes
  for (const [indexName, fd] of expectedIndexes) {
    if (!existingSet.has(indexName)) {
      const result = await ensureFieldIndex(fd, ctx);
      if (result.action === "created") {
        created.push(indexName);
      }
    } else {
      unchanged.push(indexName);
    }
  }

  // Drop orphaned indexes
  for (const indexName of existingSet) {
    if (!expectedIndexes.has(indexName)) {
      // Parse the entity type from the index name to build a minimal FieldDefinitionLike
      const parts = indexName.match(/^idx_(\w+)_cf_(\w+)$/);
      if (parts) {
        const [, table, fieldName] = parts;
        const result = await dropFieldIndex(
          {
            name: fieldName,
            entityType: table,
            dataType: "TEXT",
            isSearchable: false,
            isFilterable: false,
          },
          ctx,
        );
        if (result.action === "dropped") {
          dropped.push(indexName);
        }
      }
    }
  }

  logger.info(
    { tenantId, created: created.length, dropped: dropped.length, unchanged: unchanged.length },
    "Field index reconciliation complete",
  );

  return { created, dropped, unchanged };
}
