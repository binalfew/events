import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCheckOverdueSLAs = vi.fn();

vi.mock("~/services/workflow-engine/sla-checker.server", () => ({
  checkOverdueSLAs: mockCheckOverdueSLAs,
}));

describe("sla-job.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Stop job if running
    const { stopSLACheckJob } = await import("../sla-job.server");
    stopSLACheckJob();
    vi.useRealTimers();
  });

  it("does not run in test environment", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    const { startSLACheckJob } = await import("../sla-job.server");
    startSLACheckJob();

    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(mockCheckOverdueSLAs).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it("starts and runs at configured interval", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { startSLACheckJob, stopSLACheckJob } = await import("../sla-job.server");
    // Reset any previous state
    stopSLACheckJob();

    mockCheckOverdueSLAs.mockResolvedValue({
      checked: 0,
      warnings: 0,
      breached: 0,
      actions: [],
    });

    startSLACheckJob();

    // Advance by one interval (5 minutes default)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(mockCheckOverdueSLAs).toHaveBeenCalledTimes(1);

    // Advance by another interval
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(mockCheckOverdueSLAs).toHaveBeenCalledTimes(2);

    process.env.NODE_ENV = originalEnv;
  });

  it("stops cleanly", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { startSLACheckJob, stopSLACheckJob } = await import("../sla-job.server");
    stopSLACheckJob(); // Reset state

    mockCheckOverdueSLAs.mockResolvedValue({
      checked: 0,
      warnings: 0,
      breached: 0,
      actions: [],
    });

    startSLACheckJob();
    stopSLACheckJob();

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(mockCheckOverdueSLAs).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it("handles errors gracefully during check", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { startSLACheckJob, stopSLACheckJob } = await import("../sla-job.server");
    stopSLACheckJob(); // Reset state

    mockCheckOverdueSLAs.mockRejectedValueOnce(new Error("DB connection failed"));
    mockCheckOverdueSLAs.mockResolvedValueOnce({
      checked: 1,
      warnings: 0,
      breached: 0,
      actions: [],
    });

    startSLACheckJob();

    // First run fails
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(mockCheckOverdueSLAs).toHaveBeenCalledTimes(1);

    // Second run succeeds — job continues despite previous failure
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(mockCheckOverdueSLAs).toHaveBeenCalledTimes(2);

    process.env.NODE_ENV = originalEnv;
  });
});
