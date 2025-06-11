// server/utils/tabsStore.js
import fs   from "fs-extra";
import path from "path";

export async function readTabsFile(projectDir) {
  const tabsPath = path.join(projectDir, "tabs.json");
  if (!(await fs.pathExists(tabsPath))) {
    return [];
  }
  try {
    const raw = await fs.readFile(tabsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeTabsFile(projectDir, tabsArray) {
  await fs.ensureDir(projectDir);
  const tabsPath = path.join(projectDir, "tabs.json");
  await fs.writeFile(tabsPath, JSON.stringify(tabsArray, null, 2), "utf8");
}