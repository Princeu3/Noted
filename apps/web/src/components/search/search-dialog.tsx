import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";

interface SearchResult {
  publicId: string;
  title: string;
  icon?: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query || !workspaceId) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ results: SearchResult[] }>(
          `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`
        );
        setResults(data.results);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  function handleSelect(publicId: string) {
    onOpenChange(false);
    setQuery("");
    navigate(`/w/${workspaceId}/p/${publicId}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput placeholder="Search pages..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Pages">
            {results.map((r) => (
              <CommandItem key={r.publicId} onSelect={() => handleSelect(r.publicId)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>{r.icon} {r.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
