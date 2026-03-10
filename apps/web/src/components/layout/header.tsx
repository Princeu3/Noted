import { useParams } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface HeaderProps {
  pageTitle?: string;
  onSearchOpen: () => void;
}

export function Header({ pageTitle, onSearchOpen }: HeaderProps) {
  return (
    <header className="flex h-12 items-center gap-2 border-b border-border px-2 sm:px-3">
      <SidebarTrigger className="h-9 w-9 sm:h-8 sm:w-8" />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex-1 truncate text-sm font-medium min-w-0">
        {pageTitle || ""}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground h-9 sm:h-8 shrink-0"
        onClick={onSearchOpen}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    </header>
  );
}
