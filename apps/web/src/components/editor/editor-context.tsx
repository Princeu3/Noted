import { createContext, useContext } from "react";

interface EditorContextValue {
  pageId: number;
  upload: (file: File) => Promise<string>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  pageId,
  upload,
}: EditorContextValue & { children: React.ReactNode }) {
  return (
    <EditorContext.Provider value={{ pageId, upload }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditorContext must be used within EditorProvider");
  return ctx;
}
