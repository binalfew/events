import { data } from "react-router";
import { prisma } from "~/lib/db.server";

export async function loader() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("OK", { status: 200 });
  } catch {
    throw data("Database connection failed", { status: 503 });
  }
}
