const fs = require('fs');
const path = require('path');

const files = [
  'MentorContractsPage.tsx',
  'MentorCoursesPage.tsx',
  'MentorEarningsPage.tsx',
  'MentorReviewsPage.tsx',
  'MentorSchedulePage.tsx',
  'MentorSettingsPage.tsx',
].map(f => path.join('d:/Mentor X/mentorx-fe/src/pages/mentor', f));

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix weird AI fonts like `text-[10px] font-black uppercase tracking-[0.16em]` -> `text-[11px] font-semibold uppercase tracking-wider`
  content = content.replace(/font-black uppercase tracking-\[0\.\d+em\]/g, 'font-semibold uppercase tracking-wider');
  
  // Also clean up any tracking-widest that has font-black
  content = content.replace(/font-black uppercase tracking-widest/g, 'font-semibold uppercase tracking-wider');

  // Any remaining `font-black` that should just be `font-bold` for standard elements?
  // Let's replace font-black with font-bold globally if it's used for h1, h2, etc. (Actually maybe just simple string replace for `font-black` to `font-bold`?)
  content = content.replace(/font-black/g, 'font-bold');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
