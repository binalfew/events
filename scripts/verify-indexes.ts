import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Expected indexes for current schema models
// Table names are PascalCase, column names are camelCase (Prisma default)
const expectedIndexes: Record<string, string[][]> = {
  Tenant: [["name", "email"]],
  User: [["deletedAt"], ["tenantId"]],
  Session: [["userId", "expirationDate"]],
  Event: [["tenantId", "status"], ["deletedAt"]],
  Role: [["tenantId"]],
  Permission: [["resource", "action"]],
  RolePermission: [["roleId"], ["permissionId"]],
  UserRole: [["userId"], ["roleId"], ["eventId"]],
  ParticipantType: [["tenantId", "eventId"]],
  Workflow: [["tenantId"], ["eventId"], ["deletedAt"]],
  Step: [["workflowId"]],
  WorkflowVersion: [["workflowId"]],
  Participant: [
    ["tenantId", "eventId"],
    ["eventId", "status"],
    ["participantTypeId"],
    ["workflowId"],
    ["currentStepId"],
    ["deletedAt"],
  ],
  Approval: [
    ["participantId", "stepId"],
    ["stepId", "userId"],
    ["userId", "createdAt"],
  ],
  FieldDefinition: [
    ["tenantId", "eventId"],
    ["eventId", "participantTypeId", "sortOrder"],
  ],
  AuditLog: [["tenantId", "action"], ["tenantId", "entityType", "entityId"], ["createdAt"]],
};

async function verifyIndexes() {
  console.log("Verifying database indexes...\n");

  const indexes = await prisma.$queryRaw<
    { tablename: string; indexname: string; indexdef: string }[]
  >`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;

  let missing = 0;

  for (const [model, requiredIndexes] of Object.entries(expectedIndexes)) {
    const tableName = model;
    const tableIndexes = indexes.filter((i) => i.tablename === tableName);

    for (const columns of requiredIndexes) {
      const found = tableIndexes.some((idx) => columns.every((col) => idx.indexdef.includes(col)));

      if (found) {
        console.log(`  ✓ ${model}: index on (${columns.join(", ")})`);
      } else {
        console.log(`  ✗ ${model}: MISSING index on (${columns.join(", ")})`);
        missing++;
      }
    }
  }

  console.log(
    `\n${missing === 0 ? "All indexes present!" : `${missing} missing index(es) found.`}`,
  );

  await prisma.$disconnect();
  process.exit(missing > 0 ? 1 : 0);
}

verifyIndexes().catch((e) => {
  console.error(e);
  process.exit(1);
});
