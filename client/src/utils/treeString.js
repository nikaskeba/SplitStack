// client/src/utils/treeString.js
/**  Build an ASCII tree like “├─ foo …” from a flat list of paths.
 *   `ignore` is an array of path prefixes (folder names) to skip.  */
export default function treeString(paths, ignore = []) {
  // filter out ignored
  const keep = paths.filter(p => !ignore.some(i => p.startsWith(i + "/")));

  // build nested structure
  const root = {};
  keep.forEach(p => {
    p.split("/").reduce((node, part, i, arr) => {
      node[part] ??= (i === arr.length - 1 ? null : {});
      return node[part] || {};
    }, root);
  });

  // depth‑first print
  const out = [];
  (function walk(obj, prefix = "") {
    const entries = Object.entries(obj);
    entries.forEach(( [name, child], idx) => {
      const last = idx === entries.length - 1;
      const elbow = last ? "└─ " : "├─ ";
      out.push(prefix + elbow + name);
      if (child) {
        const nextPrefix = prefix + (last ? "   " : "│  ");
        walk(child, nextPrefix);
      }
    });
  })(root);
  return out.join("\n");
}