// server/routes/fileRoutes.js
import express from "express";
import path    from "path";
import fs      from "fs-extra";
import { splitMasterFile }   from "../utils/splitMasterFile.js";
import { composeMasterFile } from "../utils/composeMasterFile.js";
import { readTabsFile, writeTabsFile } from "../utils/tabsStore.js";

const router        = express.Router();
const PROJECTS_ROOT = path.resolve(process.cwd(), "..", "projects");

/* -------------------------------------------------- */
/* DELETE a single file under a project               */
/* URL: DELETE /api/projects/:project/files/{filePath}*/
/* -------------------------------------------------- */
router.delete("/:project/files/*", async (req, res) => {
  const { project } = req.params;
  const relativePath = req.params[0]; // wildcard capture
  const projectDir   = path.join(PROJECTS_ROOT, project);
  const fullPath     = path.join(projectDir, relativePath);

  try {
    // Ensure project exists
    if (!(await fs.pathExists(projectDir))) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Ensure file exists
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: "File not found" });
    }
    // Remove file or directory
    await fs.remove(fullPath);
    return res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Error deleting file:", err);
    return res.status(500).json({ error: "Failed to delete file" });
  }
});

/* -------------------------------------------------- */
/* GET master.txt for a project                       */
/* -------------------------------------------------- */
router.get("/:project/master", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);
  const masterPath  = path.join(projectDir, "master.txt");

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }

  let content = "";
  if (await fs.pathExists(masterPath)) {
    content = await fs.readFile(masterPath, "utf8");
  }
  return res.json({ content });
});

/* -------------------------------------------------- */
/* PUT (master → split into files)                    */
/* -------------------------------------------------- */
router.put("/:project/master", async (req, res) => {
  const { project } = req.params;
  const { content } = req.body;     // expects { content: "…full master text…" }
  const projectDir  = path.join(PROJECTS_ROOT, project);
  const masterPath  = path.join(projectDir, "master.txt");

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }

  // 1) Overwrite master.txt
  await fs.ensureDir(projectDir);
  await fs.writeFile(masterPath, content || "", "utf8");

  // 2) Write out each extracted file, but do NOT delete anything else
  const writtenFiles = await splitMasterFile(projectDir, content || "");

  // 3) Return exactly the files that splitMasterFile created/updated
  return res.json({ files: writtenFiles });
});

/* -------------------------------------------------- */
/* POST (compose files → master.txt)                  */
/* -------------------------------------------------- */
router.post("/:project/compose", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const { content, fileList } = await composeMasterFile(projectDir);

  await fs.writeFile(
    path.join(projectDir, "master.txt"),
    content,
    "utf8"
  );

  return res.json({ content, files: fileList });
});

/* -------------------------------------------------- */
/* GET all on-disk files under a project               */
/* (for sidebar)                                       */
/* -------------------------------------------------- */
router.get("/:project/files", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Recursively walk projectDir, returning relative file‐paths
  function walkSync(dir, baseDir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(name => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(walkSync(fullPath, baseDir));
      } else {
        results.push(path.relative(baseDir, fullPath));
      }
    });
    return results;
  }

  try {
    const allFiles = walkSync(projectDir, projectDir);
    return res.json(allFiles);
  } catch (err) {
    console.error("Error listing files:", err);
    return res.status(500).json({ error: "Failed to list files" });
  }
});

/* -------------------------------------------------- */
/* GET tabs.json (which tabs are open)                 */
/* -------------------------------------------------- */
router.get("/:project/tabs", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }

  try {
    const tabsArray = await readTabsFile(projectDir);
    return res.json({ tabs: tabsArray });
  } catch (err) {
    console.error("Error reading tabs.json:", err);
    return res.status(500).json({ error: "Failed to read tabs" });
  }
});

/* -------------------------------------------------- */
/* PUT tabs.json (save which tabs are open)            */
/* -------------------------------------------------- */
router.put("/:project/tabs", async (req, res) => {
  const { project } = req.params;
  const { tabs }    = req.body;       // expects { tabs: [...] }
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir))) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (!Array.isArray(tabs)) {
    return res.status(400).json({ error: "`tabs` must be an array of file paths" });
  }

  try {
    await writeTabsFile(projectDir, tabs);
    return res.json({ tabs });
  } catch (err) {
    console.error("Error writing tabs.json:", err);
    return res.status(500).json({ error: "Failed to save tabs" });
  }
});

/* -------------------------------------------------- */
/* DELETE tabs.json (remove persistence entirely)      */
/* URL: DELETE /api/projects/:project/tabs             */
/* -------------------------------------------------- */
router.delete("/:project/tabs", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);
  const tabsPath    = path.join(projectDir, "tabs.json");

  try {
    if (!(await fs.pathExists(projectDir))) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (await fs.pathExists(tabsPath)) {
      await fs.remove(tabsPath);
    }
    return res.json({ message: "tabs.json deleted" });
  } catch (err) {
    console.error("Error deleting tabs.json:", err);
    return res.status(500).json({ error: "Failed to delete tabs.json" });
  }
});

export default router;