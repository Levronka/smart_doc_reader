import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileOpenNextConfig } from "@opennextjs/aws/build/compileConfig.js";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceConfigPath = path.join(projectRoot, "open-next.config.ts");
const compiledConfigDir = path.join(projectRoot, ".open-next", ".build");

const { buildDir } = await compileOpenNextConfig(sourceConfigPath, {
  compileEdge: true,
});

await fs.mkdir(compiledConfigDir, { recursive: true });
await fs.copyFile(
  path.join(buildDir, "open-next.config.edge.mjs"),
  path.join(compiledConfigDir, "open-next.config.edge.mjs"),
);
