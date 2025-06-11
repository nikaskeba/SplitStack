import express from "express";
import path    from "path";
import fs      from "fs-extra";

const router = express.Router();

/* GET  /api/preview/my-project/index.html  */
router.get("/:project/*", async (req, res) => {
  const file   = req.params[0] || "index.html";
  const target = path.join(
    process.cwd(),
    "projects",
    req.params.project,
    file
  );

  /* 1) if it’s a real file on disk (image, font, etc.) just stream it */
  if (await fs.pathExists(target)) return res.sendFile(target);

  /* 2) otherwise it must be a virtual section inside master.txt */
  const masterPath = path.join(
    process.cwd(),
    "projects",
    req.params.project,
    "master.txt"
  );
  if (!(await fs.pathExists(masterPath)))
    return res.status(404).end();

  const raw     = await fs.readFile(masterPath, "utf8");
  const sectRe  = /^\/\/ === file: (.+?) ===$/;
  const parts   = raw.split("\n");
  let collecting = false, buf = [];
  for (const ln of parts) {
    const m = ln.match(sectRe);
    if (m) {
      if (collecting) break;              // already captured → stop
      collecting = m[1] === file;
      continue;
    }
    if (collecting) buf.push(ln);
  }
  if (!collecting) return res.status(404).end();

  res.type(path.extname(file) || ".html").send(buf.join("\n"));
});

export default router;