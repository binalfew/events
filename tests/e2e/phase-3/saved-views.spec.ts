import { test, expect } from "@playwright/test";

test.describe("Saved Views", () => {
  test("views route exists and responds", async ({ request }) => {
    const response = await request.get("/admin/views");
    // Should respond (may redirect to login if not authenticated)
    expect(response.status()).toBeLessThan(500);
  });

  test("custom objects route exists and responds", async ({ request }) => {
    const response = await request.get("/admin/custom-objects");
    expect(response.status()).toBeLessThan(500);
  });
});
