import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const appDir = path.resolve(rootDir, "artifacts/chocolate-quest");
const appRequire = createRequire(path.join(appDir, "package.json"));
const { build: viteBuild } = appRequire("vite");
const reactMod = appRequire("@vitejs/plugin-react");
const react = reactMod.default || reactMod;
const tailwindMod = appRequire("@tailwindcss/vite");
const tailwindcss = tailwindMod.default || tailwindMod;
const offlineDir = path.resolve(rootDir, "dist-offline");
const fontsDir = path.resolve(offlineDir, "fonts");

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght,SOFT,WONK@9..144,500,20,1;9..144,600,20,1;9..144,700,20,1&family=Inter:wght@400;500;600;700&display=swap";

const MODERN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function downloadFontsAndGenerateCss() {
  await fs.mkdir(fontsDir, { recursive: true });
  const res = await fetch(GOOGLE_FONTS_URL, {
    headers: { "User-Agent": MODERN_UA },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google Fonts CSS: ${res.status}`);
  }
  let css = await res.text();
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  const matches = [...css.matchAll(urlRegex)];
  const seen = new Map();

  let index = 0;
  for (const match of matches) {
    const remoteUrl = match[1];
    if (seen.has(remoteUrl)) continue;
    index += 1;
    const ext = path.extname(new URL(remoteUrl).pathname) || ".woff2";
    const fileName = `font-${String(index).padStart(2, "0")}${ext}`;
    const filePath = path.join(fontsDir, fileName);

    const fontRes = await fetch(remoteUrl, {
      headers: { "User-Agent": MODERN_UA },
    });
    if (!fontRes.ok) {
      throw new Error(`Failed to download font ${remoteUrl}: ${fontRes.status}`);
    }
    const buf = Buffer.from(await fontRes.arrayBuffer());
    await fs.writeFile(filePath, buf);
    seen.set(remoteUrl, `./fonts/${fileName}`);
  }

  for (const [remoteUrl, localRelPath] of seen.entries()) {
    css = css.split(remoteUrl).join(localRelPath);
  }
  return css;
}

function offlineBuildPlugin(localFontCss) {
  const virtualApiClientId = "\0virtual:offline-api-client";

  return {
    name: "chocolate-quest-offline-plugin",
    enforce: "pre",
    resolveId(source) {
      if (source === "@workspace/api-client-react") {
        return virtualApiClientId;
      }
      return null;
    },
    load(id) {
      if (id === virtualApiClientId) {
        return `
          export async function verifyDeveloperAccess(input) {
            const code = typeof input?.accessCode === "string" ? input.accessCode.trim() : "";
            return { verified: code.length >= 8 };
          }
          export async function healthCheck() {
            return { status: "ok" };
          }
        `;
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith("index.css")) {
        return {
          code: code.replace(
            /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/[^'"]+['"]\);?/g,
            "",
          ),
          map: null,
        };
      }
      return null;
    },
    transformIndexHtml(html) {
      // Remove external Google Fonts links and module/stylesheet tags that we will inline/replace cleanly
      return html
        .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi, "")
        .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/gi, "")
        .replace(/href="\/favicon\.svg"/g, 'href="./favicon.svg"');
    },
  };
}

async function main() {
  console.log("1. Cleaning and preparing dist-offline...");
  await fs.rm(offlineDir, { recursive: true, force: true });
  await fs.mkdir(offlineDir, { recursive: true });

  console.log("2. Downloading Google Fonts locally into dist-offline/fonts/...");
  const localFontCss = await downloadFontsAndGenerateCss();
  await fs.writeFile(path.join(offlineDir, "fonts.css"), localFontCss, "utf8");

  console.log("3. Building Vite bundle for Chocolate Quest...");
  const tempBuildDir = path.resolve(rootDir, "dist-offline/.tmp-vite");
  await viteBuild({
    configFile: false,
    root: appDir,
    base: "./",
    plugins: [
      offlineBuildPlugin(localFontCss),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(appDir, "src"),
        "@assets": path.resolve(rootDir, "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: tempBuildDir,
      emptyOutDir: true,
      assetsDir: "assets",
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: "iife",
          name: "ChocolateQuestApp",
          entryFileNames: "assets/app.js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  });

  // Copy CSS, JS, and public assets
  await fs.mkdir(path.join(offlineDir, "assets"), { recursive: true });
  const tempAssets = await fs.readdir(path.join(tempBuildDir, "assets"));
  for (const file of tempAssets) {
    await fs.copyFile(
      path.join(tempBuildDir, "assets", file),
      path.join(offlineDir, "assets", file),
    );
  }

  // Copy public files (favicon.svg, robots.txt)
  const tempRootFiles = await fs.readdir(tempBuildDir);
  for (const file of tempRootFiles) {
    if (file === "assets" || file === "index.html") continue;
    const stat = await fs.stat(path.join(tempBuildDir, file));
    if (stat.isFile()) {
      await fs.copyFile(
        path.join(tempBuildDir, file),
        path.join(offlineDir, file),
      );
    }
  }

  // Find generated CSS file name
  const cssFile = tempAssets.find((f) => f.endsWith(".css"));
  if (!cssFile) {
    throw new Error("Expected a compiled CSS file in assets/");
  }

  // Construct clean index.html that works over file:// without CORS errors
  const rawHtml = await fs.readFile(path.join(tempBuildDir, "index.html"), "utf8");
  const finalHtml = rawHtml
    // Remove Vite's <script type="module" crossorigin ...> and <link rel="stylesheet" crossorigin ...>
    .replace(/<script\b[^>]*type="module"[^>]*><\/script>/gi, "")
    .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, "")
    .replace(
      "</head>",
      `    <link rel="stylesheet" href="./fonts.css" />\n    <link rel="stylesheet" href="./assets/${cssFile}" />\n  </head>`,
    )
    .replace(
      "</body>",
      `    <script defer src="./assets/app.js"></script>\n  </body>`,
    );

  await fs.writeFile(path.join(offlineDir, "index.html"), finalHtml, "utf8");
  await fs.rm(tempBuildDir, { recursive: true, force: true });

  console.log("5. Offline build complete at:", offlineDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
