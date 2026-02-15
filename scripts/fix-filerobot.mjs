import { existsSync, readFileSync, writeFileSync } from "node:fs";

const files = [
  "node_modules/react-filerobot-image-editor/lib/components/buttons/HistoryButtons/UndoButton.js",
  "node_modules/react-filerobot-image-editor/lib/components/buttons/HistoryButtons/RedoButton.js",
  "node_modules/react-filerobot-image-editor/lib/components/Tabs/TabsResponsive.js",
  "node_modules/react-filerobot-image-editor/lib/components/tools/ObjectRemoval/ObjectRemovalBrushMode.js",
  "node_modules/react-filerobot-image-editor/lib/components/tools/ObjectRemoval/ObjectRemovalBrushSize.js",
  "node_modules/react-filerobot-image-editor/lib/components/tools/ObjectRemoval/ObjectRemovalBrushType.js",
];

const importLine = 'import React from"react";\n';

for (const file of files) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  if (content.includes('import React from"react";')) continue;
  writeFileSync(file, `${importLine}${content}`, "utf8");
}
