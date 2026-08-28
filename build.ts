```ts
import { join } from "path";
import { watch } from "fs";
import * as sass from "sass";
import type { BuildOutput } from "bun";

/**
 * Builds TypeScript files to a directory.
 */
export async function compile(
  filePaths: string[],
  outputDir: string
): Promise<BuildOutput | undefined> {
  const output = await Bun.build({
    entrypoints: filePaths,
    outdir: outputDir,
    splitting: false,
    emitDCEAnnotations: true,
    sourcemap: "none",
  }).catch((e) => {
    console.error("Failed to build:", e);
    return undefined;
  });

  if (!output) return;

  if (output.logs) {
    for (const log of output.logs) {
      console.error(log);
    }
  }

  return output;
}

async function build() {
  try {
    await compile(
      [
        "./src/main.ts",
        "./src/helper.ts",
        "./src/popup.ts",
        "./src/three.ts",
      ],
      "./public/dist/"
    );
  } catch (e) {
    console.error(e);
  }

  try {
    const mainScss = sass.compile("./src/scss/main.scss");
    await Bun.write("./public/dist/main.css", mainScss.css);
  } catch (e) {
    console.error("Failed to compile SCSS:", e);
  }
}

// GitHub Actions / CI: build once and exit.
// Local development: keep watching src/ for changes.
if (process.env.CI) {
  await build();
} else {
  watch(
    join(import.meta.dir, "./src"),
    { recursive: true },
    async (event, filename) => {
      console.log(`Detected ${event} in ${filename}`);
      await build();
    }
  );

  console.log("Watching!");
  await build();
}
```
