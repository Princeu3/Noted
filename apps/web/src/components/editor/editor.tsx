import { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core/extensions";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { FileText, Globe, ImageIcon, Wifi, WifiOff, Loader2, ShieldAlert } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { schema } from "./editor-schema";
import { uploadFile } from "./upload-file";
import { EditorProvider } from "./editor-context";
import "@blocknote/shadcn/style.css";

interface EditorProps {
  pageId: number;
  userName: string;
  userColor?: string;
}

function resolveTheme(theme: string): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme as "light" | "dark";
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "auth-failed";

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const config = {
    connecting: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      color: "bg-yellow-500",
      label: "Connecting...",
    },
    connected: {
      icon: <Wifi className="h-3 w-3" />,
      color: "bg-emerald-500",
      label: "Synced",
    },
    disconnected: {
      icon: <WifiOff className="h-3 w-3" />,
      color: "bg-red-500",
      label: "Disconnected — changes saved locally",
    },
    "auth-failed": {
      icon: <ShieldAlert className="h-3 w-3" />,
      color: "bg-red-500",
      label: "Authentication failed",
    },
  }[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1.5 shadow-sm cursor-default select-none transition-all hover:shadow-md">
            <span className={`h-2 w-2 rounded-full ${config.color}`} />
            <span className="text-xs text-muted-foreground">{config.icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          {config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Wrapper that manages provider lifecycle in a StrictMode-safe way.
 * useEffect (not useMemo) ensures cleanup + recreation on StrictMode re-mount.
 */
export function Editor({ pageId, userName, userColor = "#6366f1" }: EditorProps) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [connection, setConnection] = useState<{
    provider: HocuspocusProvider;
    doc: Y.Doc;
  } | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const apiUrl = import.meta.env.VITE_API_URL || "";
    let wsUrl: string;
    if (import.meta.env.VITE_HOCUSPOCUS_URL) {
      wsUrl = import.meta.env.VITE_HOCUSPOCUS_URL;
    } else if (apiUrl) {
      wsUrl = apiUrl.replace(/^http/, "ws") + "/collaboration";
    } else {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProtocol}//${window.location.host}/collaboration`;
    }

    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: String(pageId),
      document: doc,
      token: "cookie-auth",
      onConnect: () => setStatus("connected"),
      onDisconnect: () => setStatus("disconnected"),
      onAuthenticationFailed: () => setStatus("auth-failed"),
      onSynced: () => console.log("[Editor] Synced with server"),
    });

    setConnection({ provider, doc });

    return () => {
      provider.destroy();
      setConnection(null);
    };
  }, [pageId]);

  if (!connection) {
    return (
      <div className="mx-auto max-w-4xl py-8 px-4">
        <div className="text-muted-foreground">Connecting...</div>
      </div>
    );
  }

  return (
    <EditorInner
      provider={connection.provider}
      doc={connection.doc}
      status={status}
      pageId={pageId}
      userName={userName}
      userColor={userColor}
    />
  );
}

/**
 * Inner component that creates the BlockNote editor.
 * Unmounts and remounts when provider changes, giving useCreateBlockNote a fresh instance.
 */
function EditorInner({
  provider,
  doc,
  status,
  pageId,
  userName,
  userColor,
}: {
  provider: HocuspocusProvider;
  doc: Y.Doc;
  status: ConnectionStatus;
  pageId: number;
  userName: string;
  userColor: string;
}) {
  const { theme } = useTheme();
  const resolvedTheme = resolveTheme(theme);
  const upload = (file: File) => uploadFile(file, String(pageId));

  const editor = useCreateBlockNote({
    schema,
    uploadFile: upload,
    collaboration: {
      provider: provider as any,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: userName,
        color: userColor,
      },
    },
  });

  const defaultItems = getDefaultReactSlashMenuItems(editor).filter(
    (item) => item.title !== "Image" && item.title !== "Video" && item.title !== "File" && item.title !== "Audio",
  );

  const customSlashMenuItems = [
    ...defaultItems,
    {
      title: "Image",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, { type: "image" as const }),
      aliases: ["image", "img", "picture", "photo"],
      group: "Media",
      icon: <ImageIcon className="h-[18px] w-[18px]" />,
      subtext: "Upload an image",
    },
    {
      title: "PDF Document",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, { type: "pdf" as const }),
      aliases: ["pdf", "acrobat"],
      group: "Documents",
      icon: <FileText className="h-[18px] w-[18px]" />,
      subtext: "Upload and view a PDF inline",
    },
    {
      title: "Word Document",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, { type: "docx" as const }),
      aliases: ["doc", "docx", "word"],
      group: "Documents",
      icon: <FileText className="h-[18px] w-[18px]" />,
      subtext: "Upload and view a Word document inline",
    },
    {
      title: "Link Embed",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, {
          type: "linkEmbed" as const,
        }),
      aliases: ["link", "url", "embed", "bookmark"],
      group: "Embeds",
      icon: <Globe className="h-[18px] w-[18px]" />,
      subtext: "Embed a link with OpenGraph preview",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <EditorProvider pageId={pageId} upload={upload}>
        <BlockNoteView editor={editor} theme={resolvedTheme} slashMenu={false}>
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(customSlashMenuItems, query)
            }
          />
        </BlockNoteView>
      </EditorProvider>
      <StatusIndicator status={status} />
    </div>
  );
}
