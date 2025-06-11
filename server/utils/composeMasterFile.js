import fs   from "fs-extra";
import path from "path";

// folders or glob patterns to skip
const DEFAULT_EXCLUDES = [
  "node_modules", ".git", ".DS_Store",
  "dist", "build", ".next", ".cache"
];

/**
 * Walk the project folder, concatenate file contents into
 * a single master string with delimiter lines.
 * Returns { content, fileList }.
 */
export async function composeMasterFile(projectDir, excludes = DEFAULT_EXCLUDES) {
  const fileList = [];

  const walk = async dir => {
    const items = await fs.readdir(dir);
    for (const item of items) {
      if (excludes.some(ex => item === ex || item.startsWith(".") && ex === ".*"))
        continue;

      const full = path.join(dir, item);
      const rel  = path.relative(projectDir, full);
      const stat = await fs.stat(full);

      if (stat.isDirectory()) {
        await walk(full);
      } else {
        fileList.push(rel);
      }
    }
  };

  await walk(projectDir);

  let content = "";
  for (const relPath of fileList) {
    const code = await fs.readFile(path.join(projectDir, relPath), "utf8");
    content += `// === file: ${relPath} ===\n${code}\n\n`;
  }
  return { content: content.trimEnd(), fileList };
}