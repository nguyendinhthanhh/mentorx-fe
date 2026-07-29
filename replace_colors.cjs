const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.css') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Replace indigo, purple, fuchsia, violet with emerald
    content = content.replace(/\bindigo-(\d+)\b/g, 'emerald-$1');
    content = content.replace(/\bpurple-(\d+)\b/g, 'emerald-$1');
    content = content.replace(/\bviolet-(\d+)\b/g, 'emerald-$1');
    content = content.replace(/\bfuchsia-(\d+)\b/g, 'emerald-$1');

    // Also replace typical "black" button classes with emerald-600 if they look like buttons
    // Examples: 'bg-slate-900 text-white', 'bg-slate-900 px-', 'bg-slate-900 hover:bg-slate-800'
    // To be safe, we can just find any bg-slate-900 that doesn't have dark: in front, and 
    // is followed closely by text-white. 
    // Actually, simply replacing 'bg-slate-900 text-white' is too specific. Let's rely on the indigo/purple replacement first, which catches most interactive elements that were colored.
    // However, if we do want to replace `bg-slate-900` (which is often used for buttons in this template), let's replace it with `bg-emerald-600` if it's accompanied by `text-white`.
    
    content = content.replace(/(?<!dark:)\bbg-slate-900\b/g, function(match, offset, string) {
        // Only replace if 'text-white' is somewhere in the same class string
        // We can check the surrounding 200 characters for 'text-white'
        let start = Math.max(0, offset - 100);
        let end = Math.min(string.length, offset + 100);
        let context = string.substring(start, end);
        if (context.includes('text-white')) {
            return 'bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700';
        }
        return match;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(path.join(__dirname, 'src'), processFile);
