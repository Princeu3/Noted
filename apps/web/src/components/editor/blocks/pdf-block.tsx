import { createReactBlockSpec } from "@blocknote/react";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useEditorContext } from "../editor-context";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  FileText,
  Download,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const createPdfBlock = createReactBlockSpec(
  {
    type: "pdf" as const,
    propSchema: {
      url: { default: "" },
      name: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { upload } = useEditorContext();
      const [numPages, setNumPages] = useState(0);
      const [pageNumber, setPageNumber] = useState(1);
      const [scale, setScale] = useState(1.0);
      const [uploading, setUploading] = useState(false);
      const [expanded, setExpanded] = useState(false);

      if (!block.props.url) {
        return (
          <label className="flex items-center gap-2 rounded border border-dashed border-border px-3 py-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            <FileText className="h-4 w-4 shrink-0" />
            {uploading ? "Uploading..." : "Upload PDF"}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await upload(file);
                  editor.updateBlock(block, {
                    props: { url, name: file.name },
                  });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        );
      }

      return (
        <div className="rounded border border-border overflow-hidden">
          {/* Header — always visible */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-xs hover:bg-accent/50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="truncate text-foreground/80">
              {block.props.name || "PDF"}
            </span>
            <span className="text-muted-foreground">
              {numPages > 0 && `${numPages}p`}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <a
                href={block.props.url}
                download={block.props.name}
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground"
              >
                <Download className="h-3 w-3" />
              </a>
              <ChevronUp
                className={`h-3 w-3 text-muted-foreground transition-transform ${
                  expanded ? "" : "rotate-180"
                }`}
              />
            </div>
          </button>

          {/* Viewer — collapsible */}
          {expanded && (
            <>
              <div className="flex items-center justify-center gap-1 border-t border-border px-2 py-1 text-xs text-muted-foreground bg-muted/30">
                <button
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  className="p-0.5 hover:bg-accent rounded"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="tabular-nums w-8 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  className="p-0.5 hover:bg-accent rounded"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
                <span className="mx-1 text-border">·</span>
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="tabular-nums">
                  {pageNumber}/{numPages}
                </span>
                <button
                  onClick={() =>
                    setPageNumber((p) => Math.min(numPages, p + 1))
                  }
                  disabled={pageNumber >= numPages}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="overflow-auto max-h-[500px] flex justify-center bg-muted/10">
                <Document
                  file={block.props.url}
                  onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                >
                  <Page pageNumber={pageNumber} scale={scale} />
                </Document>
              </div>
            </>
          )}

          {/* Hidden loader for page count when collapsed */}
          {!expanded && numPages === 0 && (
            <div className="hidden">
              <Document
                file={block.props.url}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              />
            </div>
          )}
        </div>
      );
    },
  },
);
