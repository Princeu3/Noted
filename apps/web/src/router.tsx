import { createBrowserRouter, Navigate } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/sign-in",
    lazy: () => import("@/pages/auth/sign-in"),
  },
  {
    path: "/sign-up",
    lazy: () => import("@/pages/auth/sign-up"),
  },
  {
    path: "/accept-invitation/:id",
    lazy: () => import("@/pages/auth/accept-invitation"),
  },
  {
    path: "/w/:workspaceId",
    lazy: () => import("@/pages/workspace/layout"),
    children: [
      {
        index: true,
        lazy: () => import("@/pages/workspace/home"),
      },
      {
        path: "p/:pageId",
        lazy: () => import("@/pages/notes/page"),
      },
      {
        path: "daily",
        lazy: () => import("@/pages/daily/daily"),
      },
    ],
  },
  {
    path: "/",
    lazy: () => import("@/pages/workspace/landing"),
  },
]);
