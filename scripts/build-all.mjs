import { execSync } from "node:child_process";
import { rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const appsDir = path.join(root, "apps");
const siteDir = path.join(root, "site");

function run(label, cmd, cwd) {
  console.log(`\n🟦 ${label}\n$ (cd ${cwd}) ${cmd}\n`);
  try {
    execSync(cmd, { cwd, stdio: "inherit" });
  } catch (e) {
    console.error(`\n🟥 FAILED: ${label}\n`);
    throw e;
  }
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

if (!existsSync(siteDir)) throw new Error("Missing /site folder");
cpSync(siteDir, dist, { recursive: true });

const apps = ["clock", "music"];

for (const app of apps) {
  const appPath = path.join(appsDir, app);

  if (!existsSync(appPath)) throw new Error(`Missing app folder: ${appPath}`);

  run(`Install deps for ${app}`, "npm install --no-fund --no-audit", appPath);
  run(`Build ${app}`, "npm run build", appPath);

  const appDist = path.join(appPath, "dist");
  if (!existsSync(appDist)) throw new Error(`Build for ${app} produced no dist/: ${appDist}`);

  const target = path.join(dist, app);
  mkdirSync(target, { recursive: true });
  cpSync(appDist, target, { recursive: true });

  console.log(`✅ Copied ${appDist} -> ${target}`);
}

console.log("\n🎉 All labs built into /dist\n");