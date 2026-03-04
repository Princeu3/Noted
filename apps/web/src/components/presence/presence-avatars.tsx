import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OnlineUser } from "./presence-provider";

interface PresenceAvatarsProps {
  users: OnlineUser[];
  max?: number;
  size?: "sm" | "default";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PresenceAvatars({ users, max = 5, size = "sm" }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <TooltipProvider>
      <AvatarGroup>
        {visible.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar size={size} className="cursor-default">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback
                  style={{ backgroundColor: user.color, color: "white" }}
                  className="text-[10px] font-medium"
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{user.name}</p>
              {user.location?.pageTitle && (
                <p className="text-xs opacity-75">on {user.location.pageTitle}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <AvatarGroupCount className="text-[10px]">
            +{overflow}
          </AvatarGroupCount>
        )}
      </AvatarGroup>
    </TooltipProvider>
  );
}
