import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { TagBadge } from "./tag-badge";
import { api } from "@/lib/api";

interface Tag {
  id: number;
  publicId: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "oklch(0.7 0.15 30)",   // Red
  "oklch(0.7 0.15 60)",   // Orange
  "oklch(0.75 0.15 90)",  // Yellow
  "oklch(0.7 0.15 150)",  // Green
  "oklch(0.65 0.15 240)", // Blue
  "oklch(0.65 0.15 300)", // Purple
  "oklch(0.7 0.1 350)",   // Pink
  "oklch(0.6 0.1 200)",   // Teal
];

interface TagManagerProps {
  pagePublicId: string;
  workspaceId: number;
}

export function TagManager({ pagePublicId, workspaceId }: TagManagerProps) {
  const [pageTags, setPageTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    api<Tag[]>(`/api/pages/${pagePublicId}/tags`).then(setPageTags).catch(() => {});
    api<Tag[]>(`/api/workspaces/${workspaceId}/tags`).then(setAllTags).catch(() => {});
  }, [pagePublicId, workspaceId]);

  async function addTag(tag: Tag) {
    const newTags = [...pageTags, tag];
    setPageTags(newTags);
    await api(`/api/pages/${pagePublicId}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tagIds: newTags.map((t) => t.id) }),
    });
  }

  async function removeTag(tagId: number) {
    const newTags = pageTags.filter((t) => t.id !== tagId);
    setPageTags(newTags);
    await api(`/api/pages/${pagePublicId}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tagIds: newTags.map((t) => t.id) }),
    });
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    const color = PRESET_COLORS[allTags.length % PRESET_COLORS.length];
    const tag = await api<Tag>(`/api/workspaces/${workspaceId}/tags`, {
      method: "POST",
      body: JSON.stringify({ name: newTagName.trim(), color }),
    });
    setAllTags([...allTags, tag]);
    await addTag(tag);
    setNewTagName("");
  }

  const availableTags = allTags.filter((t) => !pageTags.some((pt) => pt.id === t.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pageTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={() => removeTag(tag.id)}
        />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-1.5">
            <Plus className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {availableTags.map((tag) => (
            <DropdownMenuItem key={tag.id} onClick={() => addTag(tag)}>
              <span
                className="mr-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </DropdownMenuItem>
          ))}
          <div className="p-2 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTag();
              }}
            >
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag..."
                className="h-7 text-xs"
              />
            </form>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
