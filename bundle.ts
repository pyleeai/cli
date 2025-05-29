import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";
import * as path from "node:path";
import * as fs from "node:fs";

async function runScript(scriptPath: string) {
  const command = new Deno.Command("bash", {
    args: [scriptPath],
    stdout: "inherit",
    stderr: "inherit",
  });
  
  const { code } = await command.output();
  if (code !== 0) {
    throw new Error(`Script ${scriptPath} failed with exit code ${code}`);
  }
}

// Custom resolver plugin for sloppy imports
const sloppyImportsPlugin = {
  name: "sloppy-imports",
  setup(build) {
    // Handle relative imports without extensions
    build.onResolve({ filter: /^\./ }, (args) => {
      const resolveDir = args.resolveDir;
      const importPath = args.path;
      
      // Try different extensions in order
      const extensions = [".ts", ".tsx", ".js", ".jsx"];
      
      for (const ext of extensions) {
        const fullPath = path.resolve(resolveDir, importPath + ext);
        if (fs.existsSync(fullPath)) {
          return { path: fullPath };
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexPath = path.resolve(resolveDir, importPath, "index" + ext);
        if (fs.existsSync(indexPath)) {
          return { path: indexPath };
        }
      }
      
      // Fall back to default resolution
      return null;
    });
  },
};

try {
  console.log("Running pre-bundling script...");
  await runScript("./scripts/replace-env-vars.sh");
  
  console.log("Bundling...");
  const result = await esbuild.build({
    plugins: [sloppyImportsPlugin, ...denoPlugins()],
    entryPoints: ["./src/bin/cli.ts"],
    outfile: "./bundle/cli.js",
    bundle: true,
    format: "esm",
    platform: "node",
    // target: "node18",
    // allowOverwrite: true,
    // resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    // mainFields: ["module", "main"],
    // tsconfig: "./tsconfig.json",
    define: {
      global: "globalThis",
    },
  });
  
  console.log("Bundle complete!");
} finally {
  console.log("Running post-bundling script...");
  await runScript("./scripts/restore-env-file.sh");
  esbuild.stop();
}
