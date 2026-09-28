const fs = require('fs');
const path = require('path');

const originalHtml = fs.readFileSync(path.resolve(__dirname, '../folio-2025/sources/index.html'), 'utf-8');

// Extract everything between <body> and </body>
const bodyContentMatch = originalHtml.match(/<body>([\s\S]*?)<\/body>/);
if (!bodyContentMatch) {
    console.error("Could not find body tag");
    process.exit(1);
}
let bodyContent = bodyContentMatch[1];

// We don't need the analytics scripts inside body if there are any
// We also need to add <GameEngine client:only="react" /> at the end

const astroTemplate = `---
import GameEngine from '../components/game/GameEngine';
import '../style/index.styl';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Vaibhav Srivastava — Portfolio</title>
  </head>
  <body>
    ${bodyContent}
    <GameEngine client:only="react" />
  </body>
</html>
`;

// Keep this historical reference generator separate from the authored portfolio.
const referenceOutput = path.resolve(__dirname, 'scratch/bruno-reference.astro');
fs.mkdirSync(path.dirname(referenceOutput), { recursive: true });
fs.writeFileSync(referenceOutput, astroTemplate);
console.log('Generated reference:', referenceOutput);
