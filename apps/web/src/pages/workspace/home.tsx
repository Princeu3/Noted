import { useOutletContext } from "react-router";
import type { WorkspaceOutletContext } from "./layout";

export function Component() {
  const { workspace } = useOutletContext<WorkspaceOutletContext>();

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a space from the sidebar or create a new one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-semibold text-muted-foreground">
        Select or create a page to get started
      </h1>
    </div>
  );
}
