import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  urlOrPathOrMethod: string,
  urlOrPathOrData?: string | unknown,
  data?: unknown
): Promise<T> {
  let method = "GET";
  let url = "";
  let payload: unknown | undefined = undefined;
  
  // Handle the various parameter combinations based on parameter types
  if (!urlOrPathOrData) {
    // Single parameter: GET request to the provided URL
    url = urlOrPathOrMethod;
  } else if (typeof urlOrPathOrData === "string" && !data) {
    // Two string parameters: First is method, second is URL
    method = urlOrPathOrMethod;
    url = urlOrPathOrData;
  } else if (typeof urlOrPathOrData === "string" && data) {
    // Three parameters: method, URL, and data
    method = urlOrPathOrMethod;
    url = urlOrPathOrData;
    payload = data;
  } else {
    // String + data: GET request to URL with data
    url = urlOrPathOrMethod;
    payload = urlOrPathOrData;
  }

  const res = await fetch(url, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : {},
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Convert the response to JSON with the specified type
  const jsonData: T = await res.json();
  return jsonData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
