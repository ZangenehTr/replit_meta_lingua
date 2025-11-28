import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Get the directory of the current module (works in both dev and production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In Replit Autoscale deployment, the bundled server runs from /run/init
  // but the build artifacts are in /home/runner/workspace/dist
  // Use process.cwd() which points to the workspace root, not import.meta.url
  const distPath = path.resolve(process.cwd(), "dist", "public");

  console.log(`[Production] Looking for static files...`);
  console.log(`  process.cwd(): ${process.cwd()}`);
  console.log(`  __dirname: ${__dirname}`);
  console.log(`  Resolved distPath: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(`Static files directory not found at: ${distPath}`);
    console.error(`Attempting fallback to __dirname-based path...`);
    
    // Fallback: try __dirname-based path (works when running locally)
    const fallbackPath = path.resolve(__dirname, "public");
    if (fs.existsSync(fallbackPath)) {
      console.log(`Using fallback path: ${fallbackPath}`);
      app.use(express.static(fallbackPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(fallbackPath, "index.html"));
      });
      return;
    }
    
    throw new Error(
      `Could not find the build directory. Tried: ${distPath} and ${fallbackPath}. Make sure to build the client first with 'npm run build'`,
    );
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (for SPA routing)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
