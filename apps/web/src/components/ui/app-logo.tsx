import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function AppLogo({ size = "md", className }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Noted"
      className={cn(
        sizes[size],
        "rounded-lg dark:invert",
        className,
      )}
    />
  );
}
