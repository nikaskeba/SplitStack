// === client/src/components/PreviewPane.jsx ===
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Renders an iframe preview for the selected HTML file.
 * If multiple .html files exist in `files`, a simple tab bar lets the
 * user switch which one is shown.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────
 * files   : [{ path, code }]   – array of open/parsed files
 * visible : boolean            – hide/show the whole pane (default true)
 */
function PreviewPane({ files, visible = true }) {
  const iframeRef = useRef(null);

  /* ── collect all .html files ──────────────────────────────────── */
  const htmlFiles = files.filter((f) => f.path.endsWith(".html"));
  const [idx, setIdx] = useState(0);

  /* reset idx when file list changes (e.g. tab closed) */
  useEffect(() => {
    if (idx >= htmlFiles.length) setIdx(0);
  }, [htmlFiles.length, idx]);

  /* ── build full <html> doc for the currently‑selected page ────── */
  const src = useMemo(() => {
    if (!files.length)
      return "<html><body><em>No files</em></body></html>";

    const htmlFile =
      htmlFiles[idx] ||
      { code: "<body><em>No .html file</em></body>" };

    /* inline ALL css/js, regardless of which html tab is active */
    const css = files
      .filter((f) => f.path.endsWith(".css"))
      .map((f) => `<style>${f.code}</style>`)
      .join("");

    const js = files
      .filter((f) => f.path.endsWith(".js"))
      .map((f) => `<script>${f.code}<\/script>`)
      .join("");

    // strip external <link> tags (avoids MIME errors in iframe)
    let doc = htmlFile.code.replace(/<link\s[^>]*>/gi, "");
    if (!/<html/i.test(doc)) {
      doc = `<html><head></head><body>${doc}</body></html>`;
    }

    // inject inline assets
    doc = doc.replace(/<\/head>/i, css + "</head>");
    doc = doc.replace(/<\/body>/i, js + "</body>");

    // add viewport if missing
    if (!/<meta\s[^>]*viewport/i.test(doc)) {
      doc = doc.replace(
        /<head>/i,
        '<head><meta name="viewport" content="width=device-width, initial-scale=1">'
      );
    }

    return doc;
  }, [files, htmlFiles, idx]);

  /* update iframe whenever src changes */
  useEffect(() => {
    if (iframeRef.current) iframeRef.current.srcdoc = src;
  }, [src]);

  if (!visible) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height:'100%' }}>
      {/* tab bar – only if >1 html file */}
      {htmlFiles.length > 1 && (
        <div
          style={{
            display: "flex",
            background: "#fafafa",
            borderBottom: "1px solid #d9d9d9",
            userSelect: "none",
          }}
        >
          {htmlFiles.map((f, i) => (
            <div
              key={f.path}
              onClick={() => setIdx(i)}
              style={{
                padding: "4px 12px",
                cursor: "pointer",
                borderRight: "1px solid #d9d9d9",
                background: idx === i ? "#fff" : "transparent",
                fontFamily: "monospace",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
              title={f.path}
            >
              {f.path.split("/").pop()}
            </div>
          ))}
        </div>
      )}

      {/* iframe preview */}
      <iframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ flex: 1, width: "100%", border: 0 }}
      />
    </div>
  );
}

export default PreviewPane;