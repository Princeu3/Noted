import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Calendar,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Monitor,
  UserPlus,
  Check,
  Trash2,
  Pencil,
  FolderOpen,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/components/layout/theme-provider";
import { SidebarPageTree } from "./sidebar-page-tree";
import type { PageTreeNode } from "@/hooks/use-page-tree";
import { api } from "@/lib/api";
import { InviteDialog } from "@/components/workspace/invite-dialog";
import { usePresence } from "@/components/presence/presence-provider";
import { PresenceAvatars } from "@/components/presence/presence-avatars";
import { AppLogo } from "@/components/ui/app-logo";

interface Workspace {
  id: number;
  publicId: string;
  name: string;
}

interface Org {
  id: string;
  name: string;
  slug?: string | null;
  metadata?: string | null;
}

interface AppSidebarProps {
  pages: PageTreeNode[];
  workspaceId?: number;
  workspaceName?: string;
  allWorkspaces: Workspace[];
  orgs: Org[];
  activeOrgId?: string;
  activeOrgName?: string;
  isPersonalOrg: boolean;
  onSwitchOrg: (orgId: string) => void;
  onCreateOrg: (name: string) => void;
  onCreateSpace: (name: string) => void;
  onRenameSpace: (publicId: string, name: string) => void;
  onDeleteSpace: (publicId: string) => void;
  onDeleteOrg: (orgId: string) => void;
  onPageCreated: () => void;
}

type DialogState =
  | { type: "none" }
  | { type: "createOrg" }
  | { type: "createSpace" }
  | { type: "renameSpace"; publicId: string; currentName: string }
  | { type: "deleteSpace"; publicId: string; name: string }
  | { type: "deleteOrg"; orgId: string; name: string }
  | { type: "invite" };

export function AppSidebar({
  pages,
  workspaceId,
  workspaceName,
  allWorkspaces,
  orgs,
  activeOrgId,
  activeOrgName,
  isPersonalOrg,
  onSwitchOrg,
  onCreateOrg,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
  onDeleteOrg,
  onPageCreated,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const { onlineUsers, usersInWorkspace } = usePresence();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  async function handleNewPage() {
    if (!workspaceId) return;
    const page = await api<{ publicId: string }>(`/api/workspaces/${workspaceId}/pages`, {
      method: "POST",
      body: JSON.stringify({ title: "Untitled" }),
    });
    onPageCreated();
    navigate(`/w/${params.workspaceId}/p/${page.publicId}`);
  }

  function openDialog(state: DialogState) {
    if (state.type === "renameSpace") {
      setInputValue(state.currentName);
    } else {
      setInputValue("");
    }
    setDialog(state);
  }

  function closeDialog() {
    setDialog({ type: "none" });
    setInputValue("");
    setLoading(false);
  }

  async function handleDialogSubmit() {
    setLoading(true);
    try {
      switch (dialog.type) {
        case "createOrg":
          if (inputValue.trim()) await onCreateOrg(inputValue.trim());
          break;
        case "createSpace":
          if (inputValue.trim()) await onCreateSpace(inputValue.trim());
          break;
        case "renameSpace":
          if (inputValue.trim()) await onRenameSpace(dialog.publicId, inputValue.trim());
          break;
        case "deleteSpace":
          await onDeleteSpace(dialog.publicId);
          break;
        case "deleteOrg":
          await onDeleteOrg(dialog.orgId);
          break;
      }
    } finally {
      closeDialog();
    }
  }

  return (
    <Sidebar>
      {/* Org Switcher */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3 space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-8">
              <AppLogo size="sm" className="shrink-0" />
              <span className="truncate text-sm font-semibold">
                {activeOrgName || "Organization"}
              </span>
              <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => onSwitchOrg(org.id)}
              >
                <span className="truncate">{org.name}</span>
                {org.id === activeOrgId && <Check className="ml-auto h-3 w-3" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDialog({ type: "createOrg" })}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </DropdownMenuItem>
            {!isPersonalOrg && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openDialog({ type: "invite" })}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Members
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() =>
                    activeOrgId && openDialog({
                      type: "deleteOrg",
                      orgId: activeOrgId,
                      name: activeOrgName || "this organization",
                    })
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Organization
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <PresenceAvatars users={onlineUsers} max={5} size="sm" />
            <span className="text-xs text-muted-foreground">
              {onlineUsers.length} online
            </span>
          </div>
        )}

        {/* Spaces List */}
        <div className="space-y-0.5">
          {allWorkspaces.map((ws) => (
            <ContextMenu key={ws.publicId}>
              <ContextMenuTrigger asChild>
                <button
                  onClick={() => navigate(`/w/${ws.publicId}`)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    ws.publicId === params.workspaceId
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{ws.name}</span>
                  {usersInWorkspace(ws.publicId).length > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {usersInWorkspace(ws.publicId).length}
                    </span>
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() =>
                    openDialog({
                      type: "renameSpace",
                      publicId: ws.publicId,
                      currentName: ws.name,
                    })
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() =>
                    openDialog({
                      type: "deleteSpace",
                      publicId: ws.publicId,
                      name: ws.name,
                    })
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
          <button
            onClick={() => openDialog({ type: "createSpace" })}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>New space</span>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {params.workspaceId && params.workspaceId !== "empty" && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate(`/w/${params.workspaceId}/daily`)}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Daily Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <div className="flex items-center justify-between px-2">
                <SidebarGroupLabel className="p-0">Pages</SidebarGroupLabel>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewPage}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <SidebarGroupContent>
                <SidebarPageTree
                  pages={pages}
                  workspaceId={params.workspaceId}
                  onPageDeleted={onPageCreated}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {(!params.workspaceId || params.workspaceId === "empty") && allWorkspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No spaces yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDialog({ type: "createSpace" })}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Create a space
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{user?.name || "User"}</span>
              <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light {theme === "light" && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark {theme === "dark" && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              System {theme === "system" && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate("/sign-in");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      {/* Dialogs */}
      <Dialog open={dialog.type === "createOrg"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Create a shared organization to collaborate with others.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Organization name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDialogSubmit} disabled={loading || !inputValue.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "createSpace"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Space</DialogTitle>
            <DialogDescription>Create a new space to organize your pages.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Space name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDialogSubmit} disabled={loading || !inputValue.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "renameSpace"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Space</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Space name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDialogSubmit} disabled={loading || !inputValue.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "deleteSpace"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Space</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{dialog.type === "deleteSpace" ? dialog.name : ""}"? All pages and tasks in this space will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleDialogSubmit} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "deleteOrg"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{dialog.type === "deleteOrg" ? dialog.name : ""}"? All spaces, pages, and data will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleDialogSubmit} disabled={loading}>
              {loading ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteDialog
        open={dialog.type === "invite"}
        onOpenChange={(open) => !open && closeDialog()}
      />
    </Sidebar>
  );
}
