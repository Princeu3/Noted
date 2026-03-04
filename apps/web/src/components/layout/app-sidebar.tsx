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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Calendar, ChevronDown, LogOut, Sun, Moon, Monitor, UserPlus, Building2 } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/components/layout/theme-provider";
import { SidebarPageTree } from "./sidebar-page-tree";
import type { PageTreeNode } from "@/hooks/use-page-tree";
import { api } from "@/lib/api";
import { InviteDialog } from "@/components/workspace/invite-dialog";

interface Workspace {
  id: number;
  publicId: string;
  name: string;
}

interface Org {
  id: string;
  name: string;
  slug?: string | null;
}

interface AppSidebarProps {
  pages: PageTreeNode[];
  workspaceId?: number;
  workspaceName?: string;
  allWorkspaces: Workspace[];
  orgs: Org[];
  activeOrgId?: string;
  onSwitchOrg: (orgId: string) => void;
  onPageCreated: () => void;
}

export function AppSidebar({ pages, workspaceId, workspaceName, allWorkspaces, orgs, activeOrgId, onSwitchOrg, onPageCreated }: AppSidebarProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const isSharedWorkspace = workspaceName?.toLowerCase() === "shared";

  async function handleNewPage() {
    if (!workspaceId) return;
    const page = await api<{ publicId: string }>(`/api/workspaces/${workspaceId}/pages`, {
      method: "POST",
      body: JSON.stringify({ title: "Untitled" }),
    });
    onPageCreated();
    navigate(`/w/${params.workspaceId}/p/${page.publicId}`);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3 space-y-2">
        {orgs.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-8">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-semibold">
                  {orgs.find((o) => o.id === activeOrgId)?.name || "Workspace"}
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
                  {org.name} {org.id === activeOrgId && "✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate">
            {workspaceName || "Noted"}
          </span>
          <div className="flex gap-1">
            {isSharedWorkspace && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewPage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {allWorkspaces.length > 1 && (
          <div className="flex gap-1 rounded-md bg-muted p-0.5">
            {allWorkspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => navigate(`/w/${ws.publicId}`)}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  ws.publicId === params.workspaceId
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
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
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarPageTree
              pages={pages}
              workspaceId={params.workspaceId}
              onPageDeleted={onPageCreated}
            />
          </SidebarGroupContent>
        </SidebarGroup>
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
              Light {theme === "light" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark {theme === "dark" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              System {theme === "system" && "✓"}
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
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </Sidebar>
  );
}
