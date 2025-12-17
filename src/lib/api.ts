function removeLeadingSlash(path: string) {
  return path.replace(/^\//, "");
}

function makeUrl(baseUrl: string, path: string, params?: URLSearchParams) {
  // Means it is a full URL
  if (URL.canParse(path)) {
    const url = new URL(path);
    if (params) {
      url.search = params.toString();
    }
    return url;
  }

  const _baseUrl = new URL(baseUrl);
  const url = new URL(
    _baseUrl.pathname === "/"
      ? path
      : `${_baseUrl.pathname}/${removeLeadingSlash(path)}`,
    _baseUrl.origin
  );
  if (params) {
    url.search = params.toString();
  }
  return url;
}

export function createFetchClient(baseUrl: string) {
  return {
    get: <TResponse>(
      path: string,
      params?: URLSearchParams,
      init?: RequestInit
    ) => {
      return typedFetch<TResponse>(makeUrl(baseUrl, path, params), init);
    },
    post: <TResponse>(
      path: string,
      body: any,
      init?: Omit<RequestInit, "body" | "method">
    ) => {
      return typedFetch<TResponse>(makeUrl(baseUrl, path).toString(), {
        ...init,
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    put: <TResponse>(path: string, body: any, init?: RequestInit) => {
      return typedFetch<TResponse>(makeUrl(baseUrl, path).toString(), {
        ...init,
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    delete: <TResponse>(path: string, init?: RequestInit) => {
      return typedFetch<TResponse>(makeUrl(baseUrl, path).toString(), init);
    },
    patch: <TResponse>(path: string, body: any, init?: RequestInit) => {
      return typedFetch<TResponse>(makeUrl(baseUrl, path).toString(), {
        ...init,
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
  };
}

export async function typedFetch<TResponse>(
  input: string | URL | Request,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(
      `[${response.status}] Failed to fetch ${input}: ${
        response.statusText
      } - ${await response.text().catch(() => "Body not available")}`
    );
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<TResponse>;
  }

  throw new Error(`Unsupported content type: ${contentType}`);
}
