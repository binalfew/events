import { test, expect } from "@playwright/test";

test.describe("Conditional Workflow Routing", () => {
  test("admin route exists and responds", async ({ request }) => {
    const response = await request.get("/admin");
    // Should respond (may redirect to login if not authenticated)
    expect(response.status()).toBeLessThan(500);
  });

  test("health check is available", async ({ request }) => {
    const response = await request.get("/up");
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
