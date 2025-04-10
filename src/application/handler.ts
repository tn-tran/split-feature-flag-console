declare global {
  interface Window {
    _splitInterceptedXHR?: boolean;
    _splitInterceptedFetch?: boolean;
    _splitOverridesApplied?: boolean;
  }

  interface XMLHttpRequest {
    _url?: string;
  }

  interface SplitInterceptDetail {
    url: string;
    response: any;
  }
}

const SPLIT_API_PATTERN = "sdk.split.io/api/splitChanges";

export function getStoredOverrides(): Record<string, string> {
  try {
    const stored = localStorage.getItem("split_treatment_overrides");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveOverrides(treatments: Record<string, { treatment: string }>) {
  const overridesMap = Object.entries(treatments).reduce(
    (acc, [key, value]) => {
      acc[key] = value.treatment;
      return acc;
    },
    {} as Record<string, string>
  );

  localStorage.setItem(
    "split_treatment_overrides",
    JSON.stringify(overridesMap)
  );
}

function dispatchSplitInterceptEvent(url: string, response: any) {
  const overrides = getStoredOverrides();

  const patchedResponse = {
    ...response,
    splits: response.splits.map((split: any) => {
      const override = overrides[split.name];
      if (override) {
        if (!localStorage.getItem(`original_split_${split.name}`)) {
          localStorage.setItem(
            `original_split_${split.name}`,
            JSON.stringify(split)
          );
        }

        const modifiedSplit = {
          ...split,
          defaultTreatment: override,
        };

        if (modifiedSplit.conditions && modifiedSplit.conditions.length > 0) {
          modifiedSplit.conditions = modifiedSplit.conditions.map(
            (condition: any) => {
              if (condition.partitions && condition.partitions.length > 0) {
                const overridePartitionIndex = condition.partitions.findIndex(
                  (p: any) => p.treatment === override
                );

                if (overridePartitionIndex >= 0) {
                  const newPartitions = [...condition.partitions];

                  newPartitions.forEach((p, i) => {
                    p.size = i === overridePartitionIndex ? 100 : 0;
                  });

                  return {
                    ...condition,
                    partitions: newPartitions,
                  };
                }
              }
              return condition;
            }
          );
        }

        return modifiedSplit;
      }
      return split;
    }),
  };

  localStorage.setItem(
    "intercepted_splits",
    JSON.stringify(patchedResponse.splits)
  );

  const event = new CustomEvent<SplitInterceptDetail>("split-intercept", {
    detail: { url, response: patchedResponse },
  });

  window.dispatchEvent(event);

  window._splitOverridesApplied = true;
}

// Intercept XMLHttpRequest
export function interceptSplitXHR(): void {
  if (window._splitInterceptedXHR) return;
  window._splitInterceptedXHR = true;

  const XHR = XMLHttpRequest.prototype;
  const originalOpen = XHR.open;
  const originalSend = XHR.send;

  XHR.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ): any {
    this._url = typeof url === "string" ? url : url.toString();
    return originalOpen.call(this, method, url, async, username, password);
  };

  XHR.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null
  ): any {
    this.addEventListener("readystatechange", function () {
      const url = (this as any)._url;
      if (this.readyState === 4 && typeof url === "string") {
        if (url.includes(SPLIT_API_PATTERN)) {
          try {
            const response = JSON.parse(this.responseText);
            dispatchSplitInterceptEvent(url, response);
          } catch (err) {
            console.warn("[Split.io XHR] Failed to parse response:", err);
          }
        }
      }
    });

    return originalSend.call(this, body);
  };
}

export function interceptSplitFetch(): void {
  if (window._splitInterceptedFetch) return;
  window._splitInterceptedFetch = true;

  const originalFetch = window.fetch;

  window.fetch = async (
    ...args: Parameters<typeof fetch>
  ): Promise<Response> => {
    const [input] = args;
    let url: string;

    if (typeof input === "string") {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = "";
    }

    const response = await originalFetch(...args);

    if (url.includes(SPLIT_API_PATTERN)) {
      try {
        const cloned = response.clone();
        const json = await cloned.json();
        dispatchSplitInterceptEvent(url, json);
      } catch (err) {
        console.warn("[Split.io Fetch] Failed to parse response:", err);
      }
    }

    return response;
  };
}

export function forceSplitRefresh() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("SPLITIO.")) {
      localStorage.removeItem(key);
    }
  });
}

export function applySplitOverrides(
  treatments: Record<string, { treatment: string }>
) {
  saveOverrides(treatments);

  forceSplitRefresh();

  const observer = new MutationObserver(() => {
    if (!window._splitOverridesApplied) {
      const interceptedSplits = localStorage.getItem("intercepted_splits");
      if (interceptedSplits) {
        forceSplitRefresh();
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  return true;
}

export function interceptSplitRequests(): void {
  interceptSplitXHR();
  interceptSplitFetch();
  interceptLocalStorage();
  const overrides = getStoredOverrides();
  if (Object.keys(overrides).length > 0) {
    forceSplitRefresh();
  }
}

export function interceptLocalStorage() {
  const overrides = getStoredOverrides();
  console.log("overrides:", overrides);
  if (Object.keys(overrides).length === 0) return;

  const originalGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key: string) {
    const original = originalGetItem.call(this, key);

    if (key && key.startsWith("SPLITIO.")) {
      try {
        // Parse the value
        const value = JSON.parse(original ?? "");
        if (value && typeof value === "object") {
          Object.keys(overrides).forEach((flagName) => {
            if (key.includes(flagName) && value.treatment) {
              value.treatment = overrides[flagName];
            }
          });

          return JSON.stringify(value);
        }
      } catch (e) {
        console.log("SplitConsole:", e);
      }
    }

    return original;
  };
}
