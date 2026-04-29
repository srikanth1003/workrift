import { cpSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

execSync("npx vite build", { stdio: "inherit" });

const manifest = JSON.parse(readFileSync("public/manifest.json", "utf-8"));

manifest.action.default_popup = "src/popup/index.html";
manifest.background.service_worker = "service-worker.js";
manifest.content_scripts[0].js = ["content-script.js"];

const iconSizes = ["16", "48", "128"];
mkdirSync("dist/assets", { recursive: true });

for (const size of iconSizes) {
  try {
    cpSync(`src/assets/icon-${size}.svg`, `dist/assets/icon-${size}.svg`);
  } catch {
    // Icons may not exist yet
  }
}

manifest.action.default_icon = Object.fromEntries(
  iconSizes.map((s) => [s, `assets/icon-${s}.svg`])
);
manifest.icons = Object.fromEntries(
  iconSizes.map((s) => [s, `assets/icon-${s}.svg`])
);

writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));
console.log("Build complete. Load dist/ as unpacked extension in Chrome.");
