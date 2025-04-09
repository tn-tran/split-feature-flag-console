declare global {
  interface Window {
    _splitInterceptedXHR?: boolean;
    _splitInterceptedFetch?: boolean;
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

function dispatchSplitInterceptEvent(url: string, response: any) {
  const event = new CustomEvent<SplitInterceptDetail>("split-intercept", {
    detail: { url, response },
  });

  window.dispatchEvent(event);
}

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
            console.log("[XHR] Intercepted Split.io:", url);
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
        console.log("[fetch] Intercepted Split.io:", url);
      } catch (err) {
        console.warn("[Split.io Fetch] Failed to parse response:", err);
      }
    }

    return response;
  };
}
export function interceptSplitRequests(): void {
  interceptSplitXHR();
  interceptSplitFetch();
}
