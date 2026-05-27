import { readFileSync, writeFileSync } from "node:fs";
import { buildMisskeyExplorerPresetsFromDefinitionText } from "../src/utils/misskeyExplorerGenerator.ts";

const definitionPath = "node_modules/misskey-js/built/autogen/endpoint.d.ts";
const outputPath = "src/utils/misskeyExplorer.generated.ts";

const definitionText = readFileSync(definitionPath, "utf8");
const presets = buildMisskeyExplorerPresetsFromDefinitionText(definitionText);

const output = `import type { MisskeyExplorerPreset } from './misskeyExplorer.ts';

export const MISSKEY_EXPLORER_PRESETS: MisskeyExplorerPreset[] = ${JSON.stringify(presets, null, 2)};
`;

writeFileSync(outputPath, output);
console.log(`Generated ${presets.length} Misskey explorer presets.`);
