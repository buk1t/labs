import { execSync } from "node:child_process";
import { rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const appsDir = path.join(root, "apps");
const siteDir = path.join(root, "site");

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// 1) Copy directory homepage to dist root
if (!existsSync(siteDir)) {
  throw new Error("Missing /site folder");
}
cpSync(siteDir, dist, { recursive: true });

// 2) Build each app and copy to dist/<appname>
const apps = ["clock", "music"]; // <-- add new ones here

for (const app of apps) {
  const appPath = path.join(appsDir, app);

  run("npm install --no-fund --no-audit", appPath);
  run("npm run build", appPath);  // Vite build

  const appDist = path.join(appPath, "dist");
  const target = path.join(dist, app);

  mkdirSync(target, { recursive: true });
  cpSync(appDist, target, { recursive: true });

  console.log(`✅ Built ${app} -> dist/${app}`);
}

console.log("🎉 All labs built into /dist");