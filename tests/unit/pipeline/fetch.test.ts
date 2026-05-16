import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttledFetch, resetThrottle } from "@/lib/pipeline/fetch";

describe("throttledFetch", () => {
  beforeEach(() => {
    resetThrottle();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("posílá User-Agent header", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const promise = throttledFetch("https://example.com/api", {
      userAgent: "test-agent",
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "test-agent",
        }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("throttluje 1 req/s — druhý request čeká", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const p1 = throttledFetch("https://a", { userAgent: "t" });
    const p2 = throttledFetch("https://b", { userAgent: "t" });

    await vi.advanceTimersByTimeAsync(10);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(900);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    await p1;
    await p2;
    fetchSpy.mockRestore();
  });

  it("retry při 503 (3 pokusy)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const promise = throttledFetch("https://x", {
      userAgent: "t",
      retries: 3,
    });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(200);
    fetchSpy.mockRestore();
  });
});
