import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SearchDialog } from "@/components/search/search-dialog";
import { useSession, useActiveOrganization } from "@/lib/auth-client";
import { usePageTree } from "@/hooks/use-page-tree";
import { api } from "@/lib/api";

export interface Workspace {
  id: number;
  publicId: string;
  name: string;
}

export interface WorkspaceOutletContext {
  workspace: Workspace | null;
  refreshPages: () => void;
}

export function Component() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { workspaceId } = useParams();
  const { data: activeOrg } = useActiveOrganization();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [workspaceError, setWorkspaceError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { pages, refresh } = usePageTree(workspace?.id);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in");
    }
  }, [session, isPending, navigate]);

  // Load workspace
  useEffect(() => {
    if (!workspaceId) return;
    setWorkspaceError(false);
    api<Workspace>(`/api/workspaces/${workspaceId}`)
      .then(setWorkspace)
      .catch(() => setWorkspaceError(true));
  }, [workspaceId]);

  // Load all workspaces for the org (redirect if no longer a member)
  useEffect(() => {
    if (!activeOrg?.id) return;
    api<Workspace[]>(`/api/workspaces?orgId=${activeOrg.id}`)
      .then(setAllWorkspaces)
      .catch((err) => {
        if (err.status === 403) {
          navigate("/", { replace: true });
        }
      });
  }, [activeOrg?.id, navigate]);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (workspaceError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive">Workspace not found</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          pages={pages}
          workspaceId={workspace?.id}
          workspaceName={workspace?.name}
          allWorkspaces={allWorkspaces}
          onPageCreated={refresh}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onSearchOpen={() => setSearchOpen(true)} />
          <main className="flex-1 overflow-auto">
            <Outlet context={{ workspace, refreshPages: refresh } satisfies WorkspaceOutletContext} />
          </main>
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
