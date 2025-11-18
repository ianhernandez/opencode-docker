import express, { Request, Response } from "express";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const app = express();
app.use(express.json());

const WORKSPACE_PATH = "/workspace";
const OPENCODE_URL = process.env.OPENCODE_URL || "http://opencode:4096";

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "opencode-backend",
    opencodeUrl: OPENCODE_URL,
    workspacePath: WORKSPACE_PATH
  });
});

// List all files in workspace
app.get("/files", async (req: Request, res: Response) => {
  try {
    const files = await readdir(WORKSPACE_PATH);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = join(WORKSPACE_PATH, file);
        const stats = await readFile(filePath, "utf-8").then(
          () => ({ name: file, type: "file" }),
          () => ({ name: file, type: "directory" })
        );
        return stats;
      })
    );
    res.json({ files: fileDetails });
  } catch (err) {
    res.status(500).json({
      error: "Failed to list files",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// Read a specific file
app.get("/files/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = join(WORKSPACE_PATH, filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = await readFile(filePath, "utf-8");
    res.json({ filename, content });
  } catch (err) {
    res.status(500).json({
      error: "Failed to read file",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// Write to a file
app.post("/files/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;

    if (!content && content !== "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const filePath = join(WORKSPACE_PATH, filename);
    await writeFile(filePath, content, "utf-8");

    res.json({
      success: true,
      message: `File ${filename} updated successfully`,
      filename,
      size: content.length
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to write file",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// Append to a file
app.patch("/files/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const filePath = join(WORKSPACE_PATH, filename);
    let existingContent = "";

    if (existsSync(filePath)) {
      existingContent = await readFile(filePath, "utf-8");
    }

    const newContent = existingContent + content;
    await writeFile(filePath, newContent, "utf-8");

    res.json({
      success: true,
      message: `Content appended to ${filename}`,
      filename,
      totalSize: newContent.length
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to append to file",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// Create a new file
app.put("/files/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { content = "" } = req.body;

    const filePath = join(WORKSPACE_PATH, filename);

    if (existsSync(filePath)) {
      return res.status(409).json({ error: "File already exists" });
    }

    await writeFile(filePath, content, "utf-8");

    res.status(201).json({
      success: true,
      message: `File ${filename} created successfully`,
      filename
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create file",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// Get workspace info
app.get("/workspace/info", (req: Request, res: Response) => {
  res.json({
    path: WORKSPACE_PATH,
    opencodeUI: OPENCODE_URL,
    preview: "http://localhost:8080",
    message: "Files in this workspace are editable via OpenCode UI and this API"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📁 Workspace: ${WORKSPACE_PATH}`);
  console.log(`🤖 OpenCode UI: ${OPENCODE_URL}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  GET    /health              - Health check`);
  console.log(`  GET    /workspace/info      - Workspace information`);
  console.log(`  GET    /files               - List all files`);
  console.log(`  GET    /files/:filename     - Read a file`);
  console.log(`  POST   /files/:filename     - Write/update a file`);
  console.log(`  PUT    /files/:filename     - Create a new file`);
  console.log(`  PATCH  /files/:filename     - Append to a file`);
});
