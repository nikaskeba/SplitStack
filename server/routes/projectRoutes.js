// server/routes/projectRoutes.js
import express from "express";
import fs      from "fs-extra";
import path    from "path";
import { splitMasterFile } from "../utils/splitMasterFile.js";

const router        = express.Router();
const PROJECTS_ROOT = path.resolve(process.cwd(), "..", "projects");

// Ensure the top-level “projects” folder exists
fs.ensureDirSync(PROJECTS_ROOT);

/* ---------- GET /api/projects/ ---------- */
/* List all project-folder names under the “projects” directory */
router.get("/", async (_req, res) => {
  try {
    const items = await fs.readdir(PROJECTS_ROOT);
    const dirs  = [];
    for (const item of items) {
      const stat = await fs.stat(path.join(PROJECTS_ROOT, item));
      if (stat.isDirectory()) dirs.push(item);
    }
    return res.json({ projects: dirs });
  } catch (err) {
    console.error("Error listing projects:", err);
    return res.status(500).json({ error: "Failed to list projects" });
  }
});

/* ---------- POST /api/projects/ ---------- */
/* Create a new project folder and an empty master.txt */
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }
  const projectDir = path.join(PROJECTS_ROOT, name);
  try {
    if (await fs.pathExists(projectDir)) {
      return res.status(400).json({ error: "Project already exists" });
    }
    await fs.mkdir(projectDir);
    await fs.writeFile(path.join(projectDir, "master.txt"), "", "utf8");
    return res.json({ message: "Project created" });
  } catch (err) {
    console.error("Error creating project:", err);
    return res.status(500).json({ error: "Failed to create project" });
  }
});

/* ---------- GET /api/projects/:name/master ---------- */
/* Returns the contents of master.txt for the given project */
router.get("/:name/master", async (req, res) => {
  const { name } = req.params;
  const projectDir = path.join(PROJECTS_ROOT, name);
  const masterFile = path.join(projectDir, "master.txt");

  try {
    if (!(await fs.pathExists(projectDir))) {
      return res.status(404).json({ error: "Project not found" });
    }

    let content = "";
    if (await fs.pathExists(masterFile)) {
      content = await fs.readFile(masterFile, "utf8");
    }
    return res.json({ content });
  } catch (err) {
    console.error("Error reading master:", err);
    return res.status(500).json({ error: "Failed to read master file" });
  }
});

/* ---------- PUT /api/projects/:name/master ---------- */
/*
  Expects JSON body: { content: "<full master-formatted string>" }
  1) Overwrite master.txt with this content.
  2) Call splitMasterFile(...) to create/overwrite each file mentioned.
  3) Return the array of file-paths that splitMasterFile wrote.
*/
router.put("/:name/master", async (req, res) => {
  const { name } = req.params;
  const { content } = req.body;
  const projectDir  = path.join(PROJECTS_ROOT, name);
  const masterFile  = path.join(projectDir, "master.txt");

  try {
    if (!(await fs.pathExists(projectDir))) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 1) Overwrite master.txt
    await fs.ensureDir(projectDir);
    await fs.writeFile(masterFile, content || "", "utf8");

    // 2) Write each extracted file (but do NOT delete anything else)
    const writtenFiles = await splitMasterFile(projectDir, content || "");

    // 3) Return exactly the files that splitMasterFile created/updated
    return res.json({ files: writtenFiles });
  } catch (err) {
    console.error("Error saving master:", err);
    return res.status(500).json({ error: "Failed to save master file" });
  }
});

/* ---------- DELETE /api/projects/:name ---------- */
/* Delete the entire project folder and its contents */
router.delete("/:name", async (req, res) => {
  const { name } = req.params;
  const projectDir = path.join(PROJECTS_ROOT, name);

  try {
    if (!(await fs.pathExists(projectDir))) {
      return res.status(404).json({ error: "Not found" });
    }
    await fs.remove(projectDir);
    return res.json({ message: "deleted" });
  } catch (err) {
    console.error("Error deleting project:", err);
    return res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;