import { useOutletContext } from "react-router";
import type { WorkspaceOutletContext } from "./layout";

export function Component() {
  const { workspace } = useOutletContext<WorkspaceOutletContext>();

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <p className="text-muted-foreground text-center text-sm sm:text-base">
          Select a space from the sidebar or create a new one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full px-6">
      <h1 className="text-lg sm:text-2xl font-semibold text-muted-foreground text-center">
        Select or create a page to get started
      </h1>
    </div>
  );
}
