import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { settingsOps } from "@/lib/db/indexed-db";
import "@/lib/pwa";

import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      {
        name: "theme-color",
        content: "#f59e0b",
      },
      {
        title: "Fizzy Focus",
      },
      {
        name: "description",
        content: "Track time on your Fizzy tasks with a companion that matches your mood.",
      },
      // iOS PWA meta tags
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Fizzy Timer",
      },
      // Microsoft tiles
      {
        name: "msapplication-TileColor",
        content: "#050505",
      },
      {
        name: "msapplication-config",
        content: "/browserconfig.xml",
      },
      // Prevent automatic text size adjustment on iOS
      {
        name: "format-detection",
        content: "telephone=no",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      // Apple touch icons for iOS (iPhone 14, iPad, etc.)
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/icons/apple-touch-icon.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "152x152",
        href: "/icons/icon-152.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "144x144",
        href: "/icons/icon-144.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "128x128",
        href: "/icons/icon-128.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "96x96",
        href: "/icons/icon-96.png",
      },
      // Favicon
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/icons/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/icons/favicon-16x16.png",
      },
      {
        rel: "shortcut icon",
        href: "/icons/apple-touch-icon.png",
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { convexQueryClient, queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  // Check if setup is complete, redirect to /setup if not
  useEffect(() => {
    const checkSetup = async () => {
      const token = await settingsOps.getFizzyToken();
      const slug = await settingsOps.getAccountSlug();
      const pathname = window.location.pathname;

      // Allow access to these pages even if not configured
      const publicRoutes = ['/', '/setup'];
      if (publicRoutes.includes(pathname)) {
        return;
      }

      // Redirect to setup if not configured
      if (!token || !slug) {
        navigate({ to: '/setup' });
      }
    };

    checkSetup();
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convexQueryClient.convexClient}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body className="bg-[#050505]">
            <Outlet />
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
            <Scripts />
          </body>
        </html>
      </ConvexProvider>
    </QueryClientProvider>
  );
}
