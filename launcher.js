#!/usr/bin/env node
/**
 * Local launcher for the app on macOS.
 * - Starts backend (port 3003)
 * - Starts frontend dev server (port 5173)
 * - Opens the browser
 * - Cleans up child processes on exit
 */
const { spawn } = require("node:child_process");
const { resolve } = require("node:path");

const root = __dirname;
const backendDir = resolve(root, "backend");
const frontendDir = resolve(root, "frontend");
const backendPort = process.env.PORT || "3003";
const frontendPort = process.env.FRONTEND_PORT || "5173";

const children = new Set();

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const waitForServer = async (url, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 404) return true;
    } catch {
      // ignore until it is ready
    }
    await wait(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const spawnProcess = (label, cmd, args, options) => {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    ...options,
  });
  children.add(child);
  child.on("exit", (code, signal) => {
    children.delete(child);
    console.log(`[${label}] exited with code=${code} signal=${signal}`);
    if (label === "backend") {
      // If backend dies, exit everything
      process.exit(code ?? 0);
    }
  });
  return child;
};

const openBrowser = (url) => {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args =
    opener === "open"
      ? [url]
      : opener === "cmd"
        ? ["/c", "start", "", url]
        : [url];
  spawn(opener, args, { stdio: "ignore", detached: true });
};

const cleanup = () => {
  for (const child of Array.from(children)) {
    try {
      child.kill("SIGTERM");
    } catch (err) {
      console.warn("Failed to kill process", err);
    }
  }
};

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
process.on("exit", cleanup);

const main = async () => {
  console.log("Starting backend…");
  spawnProcess("backend", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
    cwd: backendDir,
    env: { ...process.env, PORT: backendPort },
  });

  console.log("Starting frontend…");
  spawnProcess("frontend", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--host", "--port", frontendPort], {
    cwd: frontendDir,
    env: { ...process.env, PORT: frontendPort },
  });

  const targetUrl = `http://localhost:${frontendPort}`;
  console.log(`Waiting for frontend at ${targetUrl}…`);
  await waitForServer(targetUrl);
  console.log("Opening browser…");
  openBrowser(targetUrl);
};

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
