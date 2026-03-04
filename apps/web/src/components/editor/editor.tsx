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
import { FileText, Globe } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
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

/**
 * Wrapper that manages provider lifecycle in a StrictMode-safe way.
 * useEffect (not useMemo) ensures cleanup + recreation on StrictMode re-mount.
 */
export function Editor({ pageId, userName, userColor = "#6366f1" }: EditorProps) {
  const [status, setStatus] = useState("connecting...");
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
      // Production: connect to API domain's /collaboration endpoint
      wsUrl = apiUrl.replace(/^http/, "ws") + "/collaboration";
    } else {
      // Dev: proxy through Vite
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
      onAuthenticationFailed: ({ reason }) => setStatus(`auth failed: ${reason}`),
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
  status: string;
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

  const customSlashMenuItems = [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "PDF Document",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, { type: "pdf" as const }),
      aliases: ["pdf", "acrobat"],
      group: "Media",
      icon: <FileText className="h-[18px] w-[18px]" />,
      subtext: "Upload and view a PDF inline",
    },
    {
      title: "Word Document",
      onItemClick: () =>
        insertOrUpdateBlockForSlashMenu(editor, { type: "docx" as const }),
      aliases: ["doc", "docx", "word"],
      group: "Media",
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
      <div className="mb-2 text-xs text-muted-foreground">
        WS: {status} | doc: {pageId}
      </div>
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
    </div>
  );
}
