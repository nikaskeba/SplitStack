// server/utils/splitMasterFile.js
import fs   from "fs-extra";
import path from "path";

/**
 * Parse the master‐content string (delimited by “// === file: X ===”),
 * then write each extracted file under `projectDir`.
 * 
 * This function returns an array of file‐paths that were written,
 * but does NOT delete anything else on disk.
 */
export async function splitMasterFile(projectDir, content) {
  const regex = /^\/\/\s*===\s*file:\s*(.*?)\s*===\s*$/gm;
  let match;
  const files = [];
  let lastIdx     = 0;
  let currentPath = null;

  // Helper to push a (path, code) entry whenever we see the next “=== file: … ===”
  const push = (p, start, end) => {
    const code = content.slice(start, end).trimStart();
    files.push({ path: p, code });
  };

  while ((match = regex.exec(content)) !== null) {
    if (currentPath !== null) {
      push(currentPath, lastIdx, match.index);
    }
    currentPath = match[1].trim();
    lastIdx     = regex.lastIndex;
  }
  if (currentPath !== null) {
    push(currentPath, lastIdx, content.length);
  }

  // 1) Write (or overwrite) each extracted file under projectDir
  const written = [];
  for (const { path: rel, code } of files) {
    const full = path.join(projectDir, rel);
    await fs.ensureDir(path.dirname(full));    // make sure parent dir exists
    await fs.writeFile(full, code, "utf8");    // overwrite/write the file
    written.push(rel);
  }

  // 2) NOTE: We deliberately do NOT delete any other files here.
  return written;
}