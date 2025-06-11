// server/server.js
import express from "express";
import cors     from "cors";
import path     from "path";
import fs       from "fs-extra";
import projectRoutes from "./routes/projectRoutes.js";
import fileRoutes    from "./routes/fileRoutes.js";
import previewRoutes from "./routes/preview.js";

const app  = express();
const PORT = process.env.PORT || 5000;

// ——— 1) ENABLE CORS FOR ALL ORIGINS ———
// This must come BEFORE any “app.use('/api/projects', ...)”
app.use(cors());       // allows Access-Control-Allow-Origin: *

// 2) JSON body parsing
app.use(express.json({ limit: "10mb" }));

// 3) MOUNT API ROUTES
app.use("/api/projects", projectRoutes);
app.use("/api/projects", fileRoutes);
app.use("/api/preview", previewRoutes);
// 4) (optional) Serve React build if present
const buildPath = path.join(process.cwd(), "..", "client", "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(buildPath, "index.html"))
  );
}

// 5) START
app.listen(PORT, () => console.log(`✅  Server running on port ${PORT}`));