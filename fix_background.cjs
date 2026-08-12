const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walkDir('src/pages').concat(walkDir('src/components')).concat(walkDir('src/layouts'));
let updatedCount = 0;
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/className=\"[^\"]+\"/g, (match) => {
    if (match.includes('  ') && !match.includes('dark:bg-')) {
      return match.replace(/(bg-[a-z]+-[0-9]+)\s{2,}/g, '$1 dark:$1-900/30 ');
    }
    return match;
  });
  
  content = content.replace(/className=\"[^\"]+\"/g, (match) => {
    return match.replace(/\s{2,}/g, ' ');
  });

  content = content.replace(/dark:bg-([a-z]+)-50-900\/30/g, 'dark:bg-$1-900/30');
  content = content.replace(/dark:bg-([a-z]+)-100-900\/30/g, 'dark:bg-$1-900/50');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    updatedCount++;
  }
}
console.log('Total files updated:', updatedCount);
