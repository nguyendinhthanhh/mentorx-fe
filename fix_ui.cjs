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
  
  // Fix rounded-[xx]
  content = content.replace(/rounded-\[28px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[24px\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[22px\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[20px\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[26px\]/g, 'rounded-2xl');

  // Fix button sizes
  content = content.replace(/h-12 w-12/g, 'h-10 w-10');
  content = content.replace(/h-12/g, 'h-10');

  // Fix bug in MentorCoursesPage
  if (file.includes('MentorCoursesPage.tsx')) {
    content = content.replace(/course\.totalRevenueMxc\.toLocaleString\(\)/g, '(course.totalRevenueMxc || 0).toLocaleString()');
    content = content.replace(/course\.lessonViews\.toLocaleString\(\)/g, '(course.lessonViews || 0).toLocaleString()');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
