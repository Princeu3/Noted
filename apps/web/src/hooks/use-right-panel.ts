import { useState, useCallback } from "react";

interface PanelState {
  isOpen: boolean;
  type: "file" | "preview" | null;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
}

export function useRightPanel() {
  const [panel, setPanel] = useState<PanelState>({
    isOpen: false,
    type: null,
    fileUrl: null,
    fileName: null,
    mimeType: null,
  });

  const openFile = useCallback((url: string, name: string, mimeType: string) => {
    setPanel({ isOpen: true, type: "file", fileUrl: url, fileName: name, mimeType });
  }, []);

  const close = useCallback(() => {
    setPanel({ isOpen: false, type: null, fileUrl: null, fileName: null, mimeType: null });
  }, []);

  return { ...panel, openFile, close };
}
