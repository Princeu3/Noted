import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SearchDialog } from "@/components/search/search-dialog";
import { useSession, useActiveOrganization, useListOrganizations, organization } from "@/lib/auth-client";
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

interface OrgMeta {
  type?: "personal" | "shared";
}

function parseOrgMetadata(org: any): OrgMeta {
  if (!org?.metadata) return {};
  if (typeof org.metadata === "object") return org.metadata;
  try {
    return JSON.parse(org.metadata);
  } catch {
    return {};
  }
}

export function Component() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { workspaceId } = useParams();
  const { data: activeOrg } = useActiveOrganization();
  const { data: orgs, refetch: refetchOrgs } = useListOrganizations();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [workspaceError, setWorkspaceError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const activeOrgMeta = parseOrgMetadata(activeOrg);
  const isPersonalOrg = activeOrgMeta.type === "personal";

  const refreshSpaces = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      const spaces = await api<Workspace[]>(`/api/workspaces?orgId=${activeOrg.id}`);
      setAllWorkspaces(spaces);
    } catch (err: any) {
      if (err.status === 403) {
        // Removed from org — redirect to personal org
        await redirectToPersonalOrg();
      }
    }
  }, [activeOrg?.id]);

  async function findPersonalOrg() {
    if (!orgs) return null;
    for (const org of orgs) {
      const meta = parseOrgMetadata(org);
      if (meta.type === "personal") return org;
    }
    return null;
  }

  async function redirectToPersonalOrg() {
    const personal = await findPersonalOrg();
    if (personal) {
      await organization.setActive({ organizationId: personal.id });
      const spaces = await api<Workspace[]>(`/api/workspaces?orgId=${personal.id}`);
      if (spaces.length > 0) {
        navigate(`/w/${spaces[0].publicId}`, { replace: true });
        return;
      }
    }
    navigate("/", { replace: true });
  }

  async function handleSwitchOrg(orgId: string) {
    await organization.setActive({ organizationId: orgId });
    const spaces = await api<Workspace[]>(`/api/workspaces?orgId=${orgId}`);
    if (spaces.length > 0) {
      navigate(`/w/${spaces[0].publicId}`, { replace: true });
    } else {
      // Org has no spaces, navigate to show empty state
      setAllWorkspaces([]);
      setWorkspace(null);
      navigate(`/w/empty`, { replace: true });
    }
  }

  async function handleCreateOrg(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now()}`;
    const { data: newOrg, error } = await organization.create({
      name,
      slug,
      metadata: { type: "shared" },
    });

    if (error || !newOrg) return;

    await organization.setActive({ organizationId: newOrg.id });
    await refetchOrgs();
    setAllWorkspaces([]);
    setWorkspace(null);
    // Navigate to empty state for the new org
    navigate(`/w/empty`, { replace: true });
  }

  async function handleCreateSpace(name: string) {
    if (!activeOrg?.id) return;

    const space = await api<Workspace>("/api/workspaces", {
      method: "POST",
      body: JSON.stringify({ name, orgId: activeOrg.id }),
    });

    await refreshSpaces();
    navigate(`/w/${space.publicId}`, { replace: true });
  }

  async function handleRenameSpace(publicId: string, name: string) {
    await api(`/api/workspaces/${publicId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    await refreshSpaces();
    // Refresh current workspace if it's the one renamed
    if (workspace?.publicId === publicId) {
      setWorkspace((prev) => (prev ? { ...prev, name } : null));
    }
  }

  async function handleDeleteSpace(publicId: string) {
    await api(`/api/workspaces/${publicId}`, { method: "DELETE" });

    const remaining = allWorkspaces.filter((w) => w.publicId !== publicId);
    setAllWorkspaces(remaining);

    // If we deleted the active space, redirect to next one or empty state
    if (workspace?.publicId === publicId) {
      if (remaining.length > 0) {
        navigate(`/w/${remaining[0].publicId}`, { replace: true });
      } else {
        setWorkspace(null);
        navigate(`/w/empty`, { replace: true });
      }
    }
  }

  async function handleDeleteOrg(orgId: string) {
    await api(`/api/organizations/${orgId}`, { method: "DELETE" });
    await refetchOrgs();
    await redirectToPersonalOrg();
  }

  const { pages, refresh } = usePageTree(workspace?.id);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in");
    }
  }, [session, isPending, navigate]);

  // Load workspace
  useEffect(() => {
    if (!workspaceId || workspaceId === "empty") {
      setWorkspace(null);
      return;
    }
    setWorkspaceError(false);
    api<Workspace>(`/api/workspaces/${workspaceId}`)
      .then(setWorkspace)
      .catch(() => setWorkspaceError(true));
  }, [workspaceId]);

  // Load all spaces for the org
  useEffect(() => {
    if (!activeOrg?.id) return;
    refreshSpaces();
  }, [activeOrg?.id, refreshSpaces]);

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
        <div className="text-destructive">Space not found</div>
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
          orgs={orgs || []}
          activeOrgId={activeOrg?.id}
          activeOrgName={activeOrg?.name}
          isPersonalOrg={isPersonalOrg}
          onSwitchOrg={handleSwitchOrg}
          onCreateOrg={handleCreateOrg}
          onCreateSpace={handleCreateSpace}
          onRenameSpace={handleRenameSpace}
          onDeleteSpace={handleDeleteSpace}
          onDeleteOrg={handleDeleteOrg}
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
