import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function TagBadge({ name, color, onRemove }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="gap-1 text-xs"
      style={{ borderColor: color, color }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 active:opacity-70 p-0.5 -m-0.5 rounded-sm">
          <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </button>
      )}
    </Badge>
  );
}
