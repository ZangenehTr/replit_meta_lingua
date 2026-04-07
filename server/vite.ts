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

  // Keep Vite HMR WebSocket alive through Replit's 30-second proxy timeout.
  // Access the underlying ws.Server and send pings every 20 seconds.
  try {
    // Vite ≥5 exposes the WS server on vite.hot.clients (internal)
    const wss = (vite as any)._wss || (vite as any).ws?.wss;
    if (wss && typeof wss.clients !== 'undefined') {
      setInterval(() => {
        wss.clients.forEach((client: any) => {
          if (client.readyState === 1 /* OPEN */) {
            client.ping();
          }
        });
      }, 20_000);
    }
  } catch {
    // non-fatal — pings just won't fire on this Vite version
  }

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
  // In Replit Autoscale deployment, the bundled server runs from /run
  // The static assets are bundled relative to the compiled index.js
  // Use __dirname (derived from import.meta.url) which points to the compiled file location
  
  // Primary path: relative to compiled server file (works in Autoscale)
  const bundledPath = path.resolve(__dirname, "public");
  // Fallback path: workspace-based (works in local dev/preview)
  const workspacePath = path.resolve(process.cwd(), "dist", "public");

  console.log(`[Production] Looking for static files...`);
  console.log(`  process.cwd(): ${process.cwd()}`);
  console.log(`  __dirname: ${__dirname}`);
  console.log(`  Bundled path (primary): ${bundledPath}`);
  console.log(`  Workspace path (fallback): ${workspacePath}`);

  let distPath: string;

  if (fs.existsSync(bundledPath)) {
    distPath = bundledPath;
    console.log(`Using bundled path: ${distPath}`);
  } else if (fs.existsSync(workspacePath)) {
    distPath = workspacePath;
    console.log(`Using workspace path: ${distPath}`);
  } else {
    console.error(`Static files not found at either path!`);
    console.error(`  Bundled: ${bundledPath}`);
    console.error(`  Workspace: ${workspacePath}`);
    throw new Error(
      `Could not find the build directory. Tried: ${bundledPath} and ${workspacePath}. Make sure to build the client first with 'npm run build'`,
    );
  }

  // List contents for debugging
  try {
    const files = fs.readdirSync(distPath);
    console.log(`Static directory contents: ${files.join(', ')}`);
  } catch (e) {
    console.error(`Failed to list directory contents: ${e}`);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (for SPA routing)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
