import { RouterProvider } from "react-router";
import { router } from "./router";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="noted-theme">
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  );
}
