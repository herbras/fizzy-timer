import { ConvexQueryClient } from "@convex-dev/react-query";
import { env } from "@fizzy-timer/env/web";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import "./index.css";
import { routeTree } from "./routeTree.gen";

// Simple loading component
function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export function getRouter() {
  const convexUrl = env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not set");
  }

  const convexQueryClient = new ConvexQueryClient(convexUrl);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 5 minutes stale time to prevent unnecessary refetches
        staleTime: 5 * 60 * 1000,
        // 10 minutes GC time to keep cached data longer
        gcTime: 10 * 60 * 1000,
        // Retry failed queries once
        retry: 1,
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-500">Page not found</p>
        </div>
      </div>
    ),
    context: { queryClient, convexQueryClient },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
