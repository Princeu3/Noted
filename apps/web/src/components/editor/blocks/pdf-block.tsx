import { createReactBlockSpec } from "@blocknote/react";
import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useEditorContext } from "../editor-context";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  FileText,
  Download,
  Eye,
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
      const containerRef = useRef<HTMLDivElement>(null);

      if (!block.props.url) {
        return (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              {uploading ? "Uploading..." : "Click to upload a PDF"}
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
          </div>
        );
      }

      // Collapsed: compact card with file info
      if (!expanded) {
        return (
          <div className="group rounded-lg border border-border overflow-hidden transition-colors hover:border-foreground/20">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {block.props.name || "PDF Document"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {numPages > 0
                    ? `PDF · ${numPages} page${numPages !== 1 ? "s" : ""}`
                    : "PDF Document"}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </span>
                <a
                  href={block.props.url}
                  download={block.props.name}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </button>
            {/* Hidden document to get page count */}
            <div className="hidden">
              <Document
                file={block.props.url}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              />
            </div>
          </div>
        );
      }

      // Expanded: full viewer
      return (
        <div
          className="rounded-lg border border-border overflow-hidden"
          ref={containerRef}
        >
          <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <FileText className="h-3.5 w-3.5 text-red-500" />
              <span className="truncate font-medium">
                {block.props.name || "PDF"}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                className="p-1 hover:bg-accent rounded"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="tabular-nums w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                className="p-1 hover:bg-accent rounded"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1.5 text-border">|</span>
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="p-1 hover:bg-accent rounded disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="tabular-nums">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={() =>
                  setPageNumber((p) => Math.min(numPages, p + 1))
                }
                disabled={pageNumber >= numPages}
                className="p-1 hover:bg-accent rounded disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1.5 text-border">|</span>
              <a
                href={block.props.url}
                download={block.props.name}
                className="p-1 hover:bg-accent rounded"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="overflow-auto max-h-[600px] flex justify-center bg-muted/20">
            <Document
              file={block.props.url}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            >
              <Page pageNumber={pageNumber} scale={scale} />
            </Document>
          </div>
        </div>
      );
    },
  },
);
