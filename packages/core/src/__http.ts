let nextRpcRequestId = 1;

type QueryParams =
  | Record<string, string | number | boolean | null | undefined>
  | URLSearchParams;

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

interface RequestOptions extends RequestInit {
  retryOptions?: RetryOptions;
  params?: QueryParams;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 0,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

class RequestError extends Error {
  constructor(
    message: string,
    public response?: Response
  ) {
    super(message);
    this.name = "RequestError";
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = (
  attempt: number,
  options: Required<RetryOptions>
): number => {
  const delay =
    options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
};

const isRetryableError = (error: any): boolean =>
  error.name === "TypeError" ||
  error.name === "AbortError" ||
  error instanceof RequestError;

const buildUrl = (url: string, params?: QueryParams): string => {
  if (!params) return url;

  const searchParams =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => [key, String(value)])
        );

  const separator = url.includes("?") ? "&" : "?";
  const queryString = searchParams.toString();

  return queryString ? `${url}${separator}${queryString}` : url;
};

export const http = {
  async request(url: string, options?: RequestOptions): Promise<Response> {
    const { params, ...fetchOptions } = options || {};
    const fullUrl = buildUrl(url, params);

    const retryOptions: Required<RetryOptions> = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options?.retryOptions,
    };

    let attempt = 1;

    while (true) {
      try {
        const res = await fetch(fullUrl, fetchOptions);

        if (!res.ok) {
          const errorText = await res.text();
          throw new RequestError(
            `Request failed with status ${res.status}: ${errorText}`,
            res
          );
        }

        return res;
      } catch (error: any) {
        if (isRetryableError(error) && attempt < retryOptions.maxRetries) {
          const delay = calculateDelay(attempt, retryOptions);
          // console.warn(
          //   `Request failed with error: ${error.message}. ` +
          //     `Retrying in ${delay}ms (attempt ${attempt}/${retryOptions.maxRetries})`
          // );
          await sleep(delay);
          attempt++;
          continue;
        }

        throw error;
      }
    }
  },

  async json<T = any>(url: string, options?: RequestOptions) {
    const res = await this.request(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return (await res.json()) as T;
  },

  get: {
    async request(url: string, params?: QueryParams, options?: RequestInit) {
      return http.request(url, {
        ...options,
        method: "GET",
        params,
      });
    },
    async json<T = any>(
      url: string,
      params?: QueryParams,
      options?: RequestInit
    ) {
      return http.json<T>(url, {
        ...options,
        method: "GET",
        params,
      });
    },
  },

  post: {
    async request(url: string, body: object, options?: RequestOptions) {
      return http.request(url, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async json<ReturnType = any, Body extends object = object>(
      url: string,
      body: Body,
      options?: RequestOptions
    ) {
      return http.json<ReturnType>(url, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },

  async jsonrpc<ReturnType = any, Params extends object = object>(
    url: string,
    method: string,
    params: Params,
    headers?: HeadersInit
  ) {
    return http.post.json<ReturnType>(
      url,
      {
        jsonrpc: "2.0",
        id: nextRpcRequestId++,
        method,
        params,
      },
      { headers }
    );
  },

  async graphql<ReturnType = any, Variables extends object = object>(
    url: string,
    query: string,
    variables: Variables,
    headers?: HeadersInit
  ) {
    return http.post.json<ReturnType>(
      url,
      {
        query,
        variables,
      },
      { headers }
    );
  },
};
