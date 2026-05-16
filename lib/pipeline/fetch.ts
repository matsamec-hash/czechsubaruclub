import pThrottle from "p-throttle";
import pRetry from "p-retry";
import type { FetchOptions } from "./types";

const DEFAULT_USER_AGENT = "czechsubaruclub.cz pipeline / info@samecdigital.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;

let throttle = pThrottle({ limit: 1, interval: 1000 });

export function resetThrottle() {
  throttle = pThrottle({ limit: 1, interval: 1000 });
}

const throttledRaw = (url: string, init: RequestInit) =>
  throttle(() => fetch(url, init))();

export async function throttledFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await pRetry(
      async () => {
        const res = await throttledRaw(url, {
          headers: {
            "User-Agent": userAgent,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
        if (res.status >= 500 || res.status === 429) {
          throw new Error(`Retryable HTTP ${res.status} for ${url}`);
        }
        return res;
      },
      {
        retries,
        minTimeout: 500,
        factor: 2,
      },
    );
  } finally {
    clearTimeout(timer);
  }
}
