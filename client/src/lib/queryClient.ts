import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
      // Reduce request frequency for production
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});

// Throttled invalidation to prevent excessive requests
const invalidationThrottleMap = new Map<string, NodeJS.Timeout>();

export const throttledInvalidateQueries = (queryKey: string[], delay: number = 1000) => {
  const keyString = queryKey.join('|');
  
  // Clear existing timeout
  if (invalidationThrottleMap.has(keyString)) {
    clearTimeout(invalidationThrottleMap.get(keyString)!);
  }
  
  // Set new timeout
  const timeoutId = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey });
    invalidationThrottleMap.delete(keyString);
  }, delay);
  
  invalidationThrottleMap.set(keyString, timeoutId);
};
