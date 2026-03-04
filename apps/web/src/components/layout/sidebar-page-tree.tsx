import { useNavigate, useParams } from "react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, ChevronRight, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { PageTreeNode } from "@/hooks/use-page-tree";

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
  const isActive = pageId === page.publicId;
  const hasChildren = page.children.length > 0;

  async function handleDelete() {
    await api(`/api/pages/${page.publicId}`, { method: "DELETE" });
    onPageDeleted();
    if (isActive) {
      navigate(`/w/${workspaceId}`);
    }
  }

  const contextMenu = (
    <ContextMenuContent>
      <ContextMenuItem onClick={handleDelete} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <Collapsible defaultOpen className="group/collapsible">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => navigate(`/w/${workspaceId}/p/${page.publicId}`)}
                  className="gap-2"
                >
                  <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  <span className="text-sm">{page.icon || ""}</span>
                  <span className="truncate">{page.title}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </ContextMenuTrigger>
            {contextMenu}
          </ContextMenu>
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => navigate(`/w/${workspaceId}/p/${page.publicId}`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="truncate">{page.title}</span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        {contextMenu}
      </ContextMenu>
    </SidebarMenuItem>
  );
}
