import esbuild from "esbuild";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

const prod = process.argv[2] === "production";

// Build-Ziel ist IMMER der test-vault. Der echte Vault (MCB) wird nur
// manuell über deploy.ps1 beliefert – siehe Vault-Regel in PROJEKT.md.
const outdir = path.join("test-vault", ".obsidian", "plugins", "lifeweeks");

const copyAssets = {
  name: "copy-assets",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length > 0) return;
      fs.mkdirSync(outdir, { recursive: true });
      fs.copyFileSync("manifest.json", path.join(outdir, "manifest.json"));
      fs.copyFileSync("styles.css", path.join(outdir, "styles.css"));
    });
  },
};

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: path.join(outdir, "main.js"),
  define: {
    "process.env.NODE_ENV": prod ? '"production"' : '"development"',
  },
  plugins: [copyAssets],
});

if (prod) {
  await context.rebuild();
  await context.dispose();
  process.exit(0);
} else {
  await context.watch();
}
