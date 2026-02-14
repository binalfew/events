import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Models that support soft delete via a `deletedAt` timestamp column.
 * When a record is soft-deleted, `deletedAt` is set to the current time.
 * All standard queries automatically filter out soft-deleted records.
 *
 * To include soft-deleted records, pass `includeDeleted: true` in the args:
 *   prisma.user.findMany({ includeDeleted: true } as any)
 */

function addSoftDeleteFilter(args: { where?: Record<string, unknown> }, includeDeleted: boolean) {
  if (!includeDeleted) {
    args.where = { ...args.where, deletedAt: null };
  }
}

function createBasePrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function withSoftDelete(client: PrismaClient) {
  return client.$extends({
    query: {
      user: {
        async findMany({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
        async findFirst({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
        async count({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
      },
      event: {
        async findMany({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
        async findFirst({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
        async count({ args, query }) {
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;
          addSoftDeleteFilter(args, includeDeleted);
          return query(args);
        },
      },
    },
  });
}

function createPrismaClient() {
  const base = createBasePrismaClient();
  return withSoftDelete(base);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
