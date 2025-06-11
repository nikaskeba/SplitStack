/* ──────────────────────────────────────────────────────────── */
/*  client/src/pages/Editor.jsx — three‑way preview + diff     */
/* ──────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror               from "@uiw/react-codemirror";
import { javascript }           from "@codemirror/lang-javascript";
import { html }                 from "@codemirror/lang-html";
import { css }                  from "@codemirror/lang-css";
import { oneDark }              from "@codemirror/theme-one-dark";
import { lintGutter }           from "@codemirror/lint";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios                    from "axios";
import { message }              from "antd";
import Split                    from "react-split";
import treeString from "../utils/treeString";
import FileTree    from "../components/FileTree";
import TopBar      from "../components/TopBar";
import TabBar      from "../components/TabBar";
import PreviewPane from "../components/PreviewPane";
import { parseMasterFile } from "../utils/fileParser";
import { EditorView } from "@codemirror/view";
const API_BASE = "http://localhost:5100/api/projects";

/* pick CodeMirror mode from path */
const langExt = (p) =>
  p.endsWith(".html") ? html()
  : p.endsWith(".css") ? css()
  : javascript({ jsx: true });

/* ============= unified‑diff helpers (unchanged) ============= */
const splitDiffByFile = (txt) => {
  const lines = txt.split("\n");
  const out   = [];
  let buf     = [];
  lines.forEach((l) => {
    if (l.startsWith("--- ") && buf.length) {
      out.push(buf.join("\n"));
      buf = [];
    }
    buf.push(l);
  });
  if (buf.length) out.push(buf.join("\n"));
  return out;
};

/** Apply ONE unified‑diff (diffText) to originalText and return patched text.
 *  Supports any header style from “@@” to “@@ -3,7 +3,6 @@ heading …”.
 */
function applyUnifiedDiffToFile(originalText, diffText) {
const lines = originalText.split("\n");
const hunks = [];
let cur = null;

diffText.split("\n").forEach((l) => {
if (l.startsWith("@@")) {
 if (cur) hunks.push(cur);
 cur = [l];
} else if (cur) {
 cur.push(l);
}
});
if (cur) hunks.push(cur);
if (!hunks.length) throw new Error("No @@ header found");

/* apply every hunk independently */
hunks.forEach((h) => {
  const m = h[0].match(/* old regex here */);
  if (!m) throw new Error("Bad hunk header: " + h[0]);

  let pointer = 0;   // …
                   // search start
for (let i = 1; i < h.length; i++) {
  const mark = h[i][0];         // 1st char:  , - or +
  const body = h[i].slice(1);   // rest of the line

  // 1) context  or  removal  → locate the line first
  if (mark === " " || mark === "-") {
    const rel = lines           // search from current pointer
      .slice(pointer)
      .findIndex(l => l.trimEnd() === body.trimEnd());

    if (rel === -1) {
      throw new Error(`Context mismatch: "${body}"`);
    }

    pointer += rel;             // jump to the matching line

    if (mark === "-") {         // actually delete, if a “‑” line
      lines.splice(pointer, 1);
      // pointer stays *on* the line that followed the deletion
    } else {
      pointer++;                // for a “ ” line, move past it
    }
  }

  // 2) addition  → just insert at the current pointer
  else if (mark === "+") {
    lines.splice(pointer, 0, body);
    pointer++;                  // move past the newly‑inserted line
  }
}
});

return lines.join("\n");
}
function applyDiffToMaster(masterText, diffSnippet) {
  const header = diffSnippet.split("\n").find((l) => l.startsWith("--- "));
  if (!header) throw new Error("Missing --- filename header");
  const target = header.replace(/^---\s*/, "").trim();

  const parts = parseMasterFile(masterText);
  const idx   = parts.findIndex((p) => p.path === target);
  if (idx === -1) throw new Error(`Section "${target}" not found`);

  const patched = applyUnifiedDiffToFile(parts[idx].code, diffSnippet);
  parts[idx].code = patched;

  return parts
    .map((p) => `// === file: ${p.path} ===\n${p.code.trimEnd()}`)
    .join("\n\n") + "\n";
}
/* ============= Thin editor pane (tabs + CodeMirror) ============= */
function EditorPane({
  sections, active, setActive,
  codeValue, onCodeChange, editorRef,
  onAdd, onClose, style = {},
}) {
 const tabPaths = sections.map(s => s.path);   
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:0,minWidth: 0, ...style }}>
      <TabBar
        sections={tabPaths}
        active={active}
        setActive={setActive}
        onAdd={onAdd}
        onClose={onClose}
      />

      <div style={{ flex:1, minHeight:0, overflow:"auto" }}>
        <CodeMirror
          value={codeValue}
          height="100%"
          theme={oneDark}
 extensions={[
   /* language mode — same logic as before */
   active.endsWith(".html") ? html()
   : active.endsWith(".css") ? css()
   : active.endsWith(".js")  ? javascript({ jsx: true })
   : active === "__TREE__"   ? []                // plain text
   : javascript({ jsx: true }),

  /* NEW: make long lines wrap so the pane can shrink */
  EditorView.lineWrapping,

   /* …or, if you prefer horizontal scrolling instead of wrapping:
      EditorView.theme({ "&": { overflowX: "auto" } }), */
 ]}
          onChange={onCodeChange}
          ref={editorRef}
        />
      </div>
    </div>
  );
}

/* ============= Main component ============= */
export default function Editor() {
  const { projectName } = useParams();
  const allProjects     = useLocation().state?.projects || [projectName];
  const navigate        = useNavigate();
  const editorRef       = useRef(null);
  const [gitIgnore, setGitIgnore] = useState([]);
  /* basic state */
  const [master, setMaster]     = useState("");
  const [active, setActive]     = useState("");      // '' ⇒ Master
  const [files,  setFiles]      = useState([]);
  const [treeOpen, setTreeOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState("partial"); // hidden|partial|full
const handleCloseDiff = () => setShowDiff(false);
  /* diff overlay */
  const [showDiff, setShowDiff] = useState(false);
  const [diffText, setDiffText] = useState("");
const treeText = useMemo(
  () => treeString(files, ["node_modules", ...gitIgnore]),
  [files, gitIgnore]
);
  /* load project data */
useEffect(() => {
  let cancelled = false;          // guards against setState after unmount

  async function fetchProject() {
    try {
      /* 1 ▪ do the two GETs in parallel */
      const [filesRes, masterRes] = await Promise.all([
        axios.get(`${API_BASE}/${projectName}/files`),
        axios.get(`${API_BASE}/${projectName}/master`),
      ]);

      /* 2 ▪ bail if the component unmounted meanwhile */
      if (cancelled) return;

      /* 3 ▪ update React state */
      const fileList = filesRes.data.filter(
        (f) => f !== "master.txt" && f !== "tabs.json"
      );
      setFiles(fileList);

      const masterTxt = masterRes.data.content || "";
      setMaster(masterTxt);

      /* pick the first section as the initial tab; fallback = Master */
      const firstSection = parseMasterFile(masterTxt)[0]?.path || "";
      setActive(firstSection);
    } catch (err) {
      message.error("Failed to load project data");
      console.error(err);
    }
  }

  fetchProject();

  /* 4 ▪ cleanup so we don’t set state after unmount */
  return () => {
    cancelled = true;
  };
}, [projectName]);   // ← re‑runs when the route changes

  /* derived */
  const sections    = useMemo(() => parseMasterFile(master), [master]);
  const codeValue   = active === ""
    ? master
    : sections.find((s) => s.path === active)?.code || "";
  const previewFiles = sections;  // always full project

  /* helpers */
  const replaceSection = (m, path, newCode) =>
    parseMasterFile(m)
      .map((p) =>
        p.path === path
          ? `// === file: ${p.path} ===\n${newCode.trimEnd()}`
          : `// === file: ${p.path} ===\n${p.code.trimEnd()}`
      )
      .join("\n\n");

  const onCodeChange = (val) =>
    setMaster((prev) =>
      active === "" ? val : replaceSection(prev, active, val)
    );

  const saveMaster = async () => {
    try {
      await axios.put(`${API_BASE}/${projectName}/master`, { content: master });
      message.success("Saved master.txt");
    } catch {
      message.error("Save failed");
    }
  };

  /* section / file actions */
  const handleCloseSection = (path) => {
    setMaster((prev) =>
      parseMasterFile(prev)
        .filter((s) => s.path !== path)
        .map((s) => `// === file: ${s.path} ===\n${s.code.trimEnd()}`)
        .join("\n\n")
    );
    if (active === path) setActive("");
  };

  const handleCreateFile = () => {
    const name = prompt("Path / name for new file (e.g. src/new.html):", "");
    if (!name) return;
    if (sections.some((s) => s.path === name))
      return message.error("File already exists");
    setMaster((prev) => `${prev.trim()}\n\n// === file: ${name} ===\n`);
    setFiles((f) => [...f, name]);
    setActive(name);
    message.success("File added – remember to Save!");
  };

  const handleAddDir = (path) =>
    setFiles((f) => (f.some((p) => p.startsWith(path)) ? f : [...f, `${path}/__keep`]));

  const handleSelectFile = (p) => {
    setActive(p);
    if (!sections.some((s) => s.path === p)) {
      setMaster((prev) => `${prev.trim()}\n\n// === file: ${p} ===\n`);
      setFiles((f) => [...f, p]);
    }
  };

  const handleDeleteFile = async (p) => {
    if (!window.confirm(`Delete "${p}"?`)) return;
    handleCloseSection(p);
    setFiles((f) => f.filter((x) => x !== p));
    try {
      await axios.delete(`${API_BASE}/${projectName}/files/${encodeURIComponent(p)}`);
    } catch {} // ignore
  };

  /* diff overlay actions */
  const handleDiffSubmit = () => {
    try {
   let updated = master;
    splitDiffByFile(diffText).forEach(
      (chunk) => (updated = applyDiffToMaster(updated, chunk))
    );
    setMaster(updated);   
      setShowDiff(false);
      message.success("Applied diff");
    } catch (err) {
      message.error(`Failed: ${err.message}`);
    }
  };

  /* ============ full‑screen preview ============ */
  if (previewMode === "full") {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh" }}>
        <TopBar onSave={saveMaster} onBack={() => setPreviewMode("partial")} />
        <button
          onClick={() => setPreviewMode("partial")}
          style={{
            position:"fixed", top:52, right:12, zIndex:2000,
            padding:"6px 14px", background:"#1677ff", color:"#fff",
            border:"none", borderRadius:4, cursor:"pointer",
          }}
        >
          Back to Editor
        </button>
        <PreviewPane files={previewFiles} visible />
      </div>
    );
  }

  /* ============ editor + (optional) preview ============ */
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <TopBar onSave={saveMaster} onBack={() => navigate("/")} />

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        {/* sidebar */}
        {treeOpen && (
          <div style={{ flex:"0 0 240px", overflow:"auto", borderRight:"1px solid #d9d9d9" }}>
            <FileTree
              projects={allProjects}
              currentProject={projectName}
              files={files}
              onSelectFile={handleSelectFile}
              onSwitchProject={(p) =>
                navigate(`/project/${encodeURIComponent(p)}`, {
                  state: { projects: allProjects },
                })
              }
              onAddDir={handleAddDir}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        )}

        {/* sidebar toggle */}
        <div
          onClick={() => setTreeOpen((v) => !v)}
          style={{
            width:14, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"#fafafa", borderRight:"1px solid #d9d9d9",
          }}
        >
          {treeOpen ? "«" : "»"}
        </div>

        {/* editor / preview */}
        {previewMode === "partial" ? (
          <Split
            direction="vertical"
            sizes={[60,40]}
            minSize={[150,120]}
            gutterSize={12}
             style={{ flex: 1, minWidth: 0 }}
            gutterStyle={() => ({
              background:"#d9d9d9", cursor:"row-resize", height:12,
            })}
          >
            <EditorPane
              sections={sections}
              active={active}
              setActive={setActive}
                codeValue={
    active === "__TREE__"
      ? treeText
      : active === "" ? master
      : sections.find(s => s.path === active)?.code || ""
  }
                onCodeChange={active === "__TREE__" ? () => {} : onCodeChange} // read‑only

              editorRef={editorRef}
              onAdd={handleCreateFile}
              onClose={handleCloseSection}
            />

            <div key="preview" style={{ flex:1 }}>
              <PreviewPane files={previewFiles} visible />
            </div>
          </Split>
        ) : (
          <EditorPane
            sections={sections}
            active={active}
            setActive={setActive}
               codeValue={
    active === "__TREE__"
      ? treeText
      : active === "" ? master
      : sections.find(s => s.path === active)?.code || ""
  }
                onCodeChange={active === "__TREE__" ? () => {} : onCodeChange} // read‑only

            editorRef={editorRef}
            style={{ flex:1 }}
            onAdd={handleCreateFile}
            onClose={handleCloseSection}
          />
        )}
      </div>

      {/* fixed controls: preview‑mode + diff */}
      <div style={{ position:"fixed", right:16, bottom:60, display:"flex", gap:8 }}>
        {/* preview mode buttons */}
        {["hidden","partial","full"].map((label) => (
          <button
            key={label}
            onClick={() => setPreviewMode(label)}
            style={{
              padding:"4px 10px",
              border: label===previewMode ? "1px solid #1677ff":"1px solid #d9d9d9",
              background:label===previewMode?"#1677ff":"#fff",
              color: label===previewMode ? "#fff" : "#000",
              borderRadius:4, cursor:"pointer",
            }}
          >
            {label[0].toUpperCase()+label.slice(1)}
          </button>
        ))}

        {/* diff button */}
        <button
          onClick={() => setShowDiff(true)}
          style={{
            padding:"4px 12px",
            background:"#faad14",
            color:"#fff",
            border:"none",
            borderRadius:4,
            cursor:"pointer",
            boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          Apply Diff
        </button>
      </div>

      {/* diff overlay */}
      {showDiff && (
        <div
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:3000,
          }}
        >
          <div
            style={{
              width:600, background:"#fff", padding:16, borderRadius:4,
              boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginTop:0 }}>Paste a unified‑diff snippet</h3>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              placeholder={`--- index.html
+++ index.html
@@
-<h1>Hello</h1>
+<h1>Bonjour</h1>`}
              style={{
                width:"100%", height:180, fontFamily:"monospace",
                resize:"vertical", padding:8,
              }}
            />
            <div style={{ textAlign:"right", marginTop:12 }}>
              <button
                onClick={handleCloseDiff}
                style={{
                  marginRight:8, padding:"6px 12px",
                  border:"1px solid #d9d9d9", borderRadius:4, cursor:"pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDiffSubmit}
                style={{
                  padding:"6px 12px", background:"#1677ff",
                  color:"#fff", border:"none", borderRadius:4, cursor:"pointer",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}