import { test, expect } from "@playwright/test";

test.describe("Delegation Flow", () => {
  test("delegation accept route exists", async ({ request }) => {
    // The public delegation accept page should respond
    const response = await request.get("/delegation/accept?token=invalid-token");
    expect(response.status()).toBeLessThan(500);
  });

  test("admin events route exists and responds", async ({ request }) => {
    const response = await request.get("/admin/events");
    // Should respond (may redirect to login if not authenticated)
    expect(response.status()).toBeLessThan(500);
  });

  test("admin assignments route exists and responds", async ({ request }) => {
    const response = await request.get("/admin/assignments");
    expect(response.status()).toBeLessThan(500);
  });
});
