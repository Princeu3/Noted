import { useNavigate, useParams } from "react-router";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, ChevronRight, Trash2, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { PageTreeNode } from "@/hooks/use-page-tree";
import { usePresence } from "@/components/presence/presence-provider";
import { PresenceAvatars } from "@/components/presence/presence-avatars";

interface SidebarPageTreeProps {
  pages: PageTreeNode[];
  workspaceId?: string;
  onPageDeleted: () => void;
}

export function SidebarPageTree({ pages, workspaceId, onPageDeleted }: SidebarPageTreeProps) {
  if (pages.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        No pages yet. Click + to create one.
      </p>
    );
  }

  return (
    <SidebarMenu>
      {pages.map((page) => (
        <PageTreeItem
          key={page.id}
          page={page}
          workspaceId={workspaceId}
          onPageDeleted={onPageDeleted}
        />
      ))}
    </SidebarMenu>
  );
}

function PageTreeItem({
  page,
  workspaceId,
  onPageDeleted,
}: {
  page: PageTreeNode;
  workspaceId?: string;
  onPageDeleted: () => void;
}) {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const { usersOnPage } = usePresence();
  const isActive = pageId === page.publicId;
  const hasChildren = page.children.length > 0;
  const pageUsers = usersOnPage(page.publicId);

  async function handleDelete() {
    await api(`/api/pages/${page.publicId}`, { method: "DELETE" });
    onPageDeleted();
    if (isActive) {
      navigate(`/w/${workspaceId}`);
    }
  }

  const actionMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <Collapsible defaultOpen className="group/collapsible">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isActive}
              onClick={() => navigate(`/w/${workspaceId}/p/${page.publicId}`)}
              className="gap-2"
            >
              <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              <span className="text-sm">{page.icon || ""}</span>
              <span className="truncate">{page.title}</span>
              {pageUsers.length > 0 && (
                <span className="ml-auto shrink-0">
                  <PresenceAvatars users={pageUsers} max={3} size="sm" />
                </span>
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          {actionMenu}
          <CollapsibleContent>
            <SidebarMenuSub>
              {page.children.map((child) => (
                <PageTreeItem
                  key={child.id}
                  page={child}
                  workspaceId={workspaceId}
                  onPageDeleted={onPageDeleted}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => navigate(`/w/${workspaceId}/p/${page.publicId}`)}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        <span className="truncate">{page.title}</span>
        {pageUsers.length > 0 && (
          <span className="ml-auto shrink-0">
            <PresenceAvatars users={pageUsers} max={3} size="sm" />
          </span>
        )}
      </SidebarMenuButton>
      {actionMenu}
    </SidebarMenuItem>
  );
}
