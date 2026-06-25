import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const MENTOR_DATA = [
  {
    fullName: 'Jane Doe',
    email: 'jane.doe.mentor1@example.com',
    password: 'Password123!',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
    headline: 'Senior Product Designer at Google',
    primaryDomain: 'Design',
    skills: ['UX Design', 'UI Design', 'Figma', 'Prototyping'],
    professionalBio: 'I am a Senior Product Designer with over 10 years of experience building delightful user experiences. I specialize in UX research, wireframing, and creating high-fidelity prototypes. I love helping aspiring designers find their path.',
    helpDescription: 'I can help you review your portfolio, prepare for design interviews, and level up your Figma skills.',
    yearsOfExperience: 10,
    locationOption: 'San Francisco, CA',
    languagesOption: 'English'
  },
  {
    fullName: 'David Smith',
    email: 'david.smith.mentor2@example.com',
    password: 'Password123!',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
    headline: 'Lead Software Engineer | Ex-Meta',
    primaryDomain: 'Software Engineering',
    skills: ['React', 'Node.js', 'System Design', 'TypeScript'],
    professionalBio: 'Former Meta engineer now leading a startup team. I have conducted over 200 technical interviews and know exactly what top tech companies are looking for. Passionate about system design and highly scalable architectures.',
    helpDescription: 'I can help you with mock interviews, resume reviews, and deep-dives into complex system design concepts.',
    yearsOfExperience: 8,
    locationOption: 'Remote / Flexible',
    languagesOption: 'English, Vietnamese'
  },
  {
    fullName: 'Emily Chen',
    email: 'emily.chen.mentor3@example.com',
    password: 'Password123!',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
    headline: 'Data Science Manager & AI Researcher',
    primaryDomain: 'Data Science & AI',
    skills: ['Python', 'Machine Learning', 'Data Strategy', 'SQL'],
    professionalBio: 'I lead a team of data scientists working on cutting-edge AI products. I love turning messy data into actionable insights and helping businesses make data-driven decisions.',
    helpDescription: 'I can mentor you in machine learning concepts, transitioning into data science, and managing data teams.',
    yearsOfExperience: 6,
    locationOption: 'Singapore, GMT+8',
    languagesOption: 'English'
  }
];

async function seedMentors() {
  console.log('Starting Mentor Seeder...');
  
  for (const mentor of MENTOR_DATA) {
    console.log(`\\nProcessing mentor: ${mentor.fullName}...`);
    try {
      // 1. Register User
      console.log('  1. Registering user...');
      let userId, accessToken;
      try {
        const regRes = await axios.post(`${API_BASE_URL}/auth/register`, {
          firstName: mentor.fullName.split(' ')[0],
          lastName: mentor.fullName.split(' ')[1],
          email: mentor.email,
          password: mentor.password,
          role: 'USER'
        });
        userId = regRes.data.data.user.id;
        accessToken = regRes.data.data.accessToken;
      } catch (err) {
        if (err.response && err.response.data?.message?.includes('already exists')) {
          console.log('     User already exists. Attempting login...');
          const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: mentor.email,
            password: mentor.password
          });
          userId = loginRes.data.data.user.id;
          accessToken = loginRes.data.data.accessToken;
        } else {
          throw err;
        }
      }
      
      console.log(`     User ID: ${userId}`);

      // 2. Update User Avatar
      console.log('  2. Updating user avatar...');
      await axios.put(`${API_BASE_URL}/users/${userId}`, {
        avatarUrl: mentor.avatarUrl
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // 3. Create Mentor Profile
      console.log('  3. Creating mentor profile with cover photo...');
      await axios.put(`${API_BASE_URL}/mentors/${userId}/profile`, {
        headline: mentor.headline,
        primaryDomain: mentor.primaryDomain,
        skills: mentor.skills,
        professionalBio: mentor.professionalBio,
        helpDescription: mentor.helpDescription,
        yearsOfExperience: mentor.yearsOfExperience,
        location: mentor.locationOption,
        languages: mentor.languagesOption.split(', '),
        coverUrl: mentor.coverUrl,
        mentorAgreementAccepted: true,
        disputePolicyAccepted: true
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      console.log(`  ✅ Successfully seeded mentor: ${mentor.fullName}`);
    } catch (error) {
      console.error(`  ❌ Failed to seed mentor ${mentor.fullName}:`, error?.response?.data || error.response || error.message);
    }
  }
  
  console.log('\\nSeeding complete!');
}

seedMentors();
