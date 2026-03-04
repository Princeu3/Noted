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
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
