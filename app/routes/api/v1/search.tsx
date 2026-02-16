import { data } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { globalSearch } from "~/services/search.server";
import type { Route } from "./+types/search";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return data({ data: { participants: [], events: [], forms: [] } });
  }

  const results = await globalSearch(q, tenantId);

  return data({ data: results });
}
