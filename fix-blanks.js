const fs = require('fs');

function replaceBlanks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/'_'/g, "'B'");
  content = content.replace(/"_"/g, '"B"');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

replaceBlanks('app/lib/examples.ts');
replaceBlanks('app/lib/templates.ts');
replaceBlanks('app/page.tsx');
replaceBlanks('app/components/TransitionEditor.tsx');
replaceBlanks('app/components/TapeVisualization.tsx');
replaceBlanks('app/lib/turingEngine.ts');
