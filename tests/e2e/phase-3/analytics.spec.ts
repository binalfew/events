import { test, expect } from "@playwright/test";

test.describe("Analytics Dashboard", () => {
  test("analytics route exists and responds", async ({ request }) => {
    const response = await request.get("/admin/analytics");
    // Should respond (may redirect to login if not authenticated)
    expect(response.status()).toBeLessThan(500);
  });

  test("health check is available", async ({ request }) => {
    const response = await request.get("/up");
    expect(response.status()).toBe(200);
  });
});
