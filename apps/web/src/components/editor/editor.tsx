import { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { useTheme } from "@/components/layout/theme-provider";
import { schema } from "./editor-schema";
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

  const editor = useCreateBlockNote({
    schema,
    collaboration: {
      provider: provider as any,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: userName,
        color: userColor,
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <div className="mb-2 text-xs text-muted-foreground">
        WS: {status} | doc: {pageId}
      </div>
      <BlockNoteView editor={editor} theme={resolvedTheme} />
    </div>
  );
}
