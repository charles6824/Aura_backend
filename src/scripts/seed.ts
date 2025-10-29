import dotenv from 'dotenv';
dotenv.config();

import Database from '../config/database';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';
import Assessment from '../models/Assessment';
import logger from '../config/logger';

const seedUsers = [
  {
    email: 'demo@aura.com',
    password: 'demo1234',
    name: 'Demo User',
    role: 'user',
    profileCompleted: true,
    assessmentCompleted: true,
    isEmailVerified: true,
    phone: '+1234567890',
    nationality: 'American',
    currentLocation: 'New York, USA',
    preferredCountries: ['Canada', 'UK', 'Australia'],
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
    experience: 5,
    education: [{
      degree: 'Bachelor of Computer Science',
      institution: 'MIT',
      year: 2018
    }],
    languages: [{
      language: 'English',
      proficiency: 'Native'
    }, {
      language: 'Spanish',
      proficiency: 'Intermediate'
    }]
  },
  {
    email: 'admin@aura.com',
    password: 'admin1234',
    name: 'Admin User',
    role: 'admin',
    profileCompleted: true,
    assessmentCompleted: true,
    isEmailVerified: true
  },
  {
    email: 'company@techcorp.com',
    password: 'company1234',
    name: 'TechCorp Recruiter',
    role: 'company',
    profileCompleted: true,
    assessmentCompleted: false,
    isEmailVerified: true,
    phone: '+1234567891',
    currentLocation: 'Toronto, Canada'
  },
  {
    email: 'john.doe@email.com',
    password: 'password123',
    name: 'John Doe',
    role: 'user',
    profileCompleted: true,
    assessmentCompleted: true,
    isEmailVerified: true,
    phone: '+1987654321',
    nationality: 'Canadian',
    currentLocation: 'Toronto, Canada',
    preferredCountries: ['USA', 'UK', 'Germany'],
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
    experience: 3,
    education: [{
      degree: 'Master of Software Engineering',
      institution: 'University of Toronto',
      year: 2020
    }],
    languages: [{
      language: 'English',
      proficiency: 'Native'
    }, {
      language: 'French',
      proficiency: 'Advanced'
    }]
  },
  {
    email: 'sarah.wilson@email.com',
    password: 'password123',
    name: 'Sarah Wilson',
    role: 'user',
    profileCompleted: true,
    assessmentCompleted: true,
    isEmailVerified: true,
    phone: '+447123456789',
    nationality: 'British',
    currentLocation: 'London, UK',
    preferredCountries: ['Australia', 'New Zealand', 'Canada'],
    skills: ['Nursing', 'Patient Care', 'Emergency Response', 'Medical Records'],
    experience: 7,
    education: [{
      degree: 'Bachelor of Nursing',
      institution: 'King\'s College London',
      year: 2016
    }],
    languages: [{
      language: 'English',
      proficiency: 'Native'
    }]
  }
];

const seedJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp Canada',
    location: 'Toronto, Canada',
    country: 'Canada',
    salary: '$85,000 - $110,000 CAD',
    type: 'Full-time',
    category: 'Technology',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
    description: 'Join our innovative team building next-generation web applications. We are looking for a passionate senior software engineer to lead development of our core platform.',
    requirements: [
      '5+ years of experience in full-stack development',
      'Bachelor\'s degree in Computer Science or related field',
      'Strong problem-solving skills',
      'Experience with cloud platforms (AWS preferred)',
      'Excellent communication skills'
    ],
    benefits: [
      'Comprehensive health insurance',
      'Visa sponsorship available',
      'Relocation assistance up to $10,000',
      'Flexible work arrangements',
      'Professional development budget'
    ],
    visaSponsorship: true,
    relocationAssistance: true,
    experienceLevel: 'Senior',
    educationLevel: 'Bachelor',
    languageRequirements: [{
      language: 'English',
      proficiency: 'Advanced'
    }],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    isUrgent: false
  },
  {
    title: 'Registered Nurse',
    company: 'Toronto General Hospital',
    location: 'Toronto, Canada',
    country: 'Canada',
    salary: '$70,000 - $85,000 CAD',
    type: 'Full-time',
    category: 'Healthcare',
    skills: ['Patient Care', 'Medical Records', 'Emergency Response', 'IV Therapy'],
    description: 'Provide exceptional patient care in our state-of-the-art medical facility. Join a team dedicated to improving patient outcomes and advancing healthcare.',
    requirements: [
      'Valid RN License',
      '2+ years of clinical experience',
      'BLS and ACLS certification',
      'Strong interpersonal skills',
      'Ability to work in fast-paced environment'
    ],
    benefits: [
      'Comprehensive health benefits',
      'Pension plan with employer matching',
      'Visa support and sponsorship',
      'Continuing education opportunities',
      'Shift differentials'
    ],
    visaSponsorship: true,
    relocationAssistance: true,
    experienceLevel: 'Mid',
    educationLevel: 'Bachelor',
    languageRequirements: [{
      language: 'English',
      proficiency: 'Advanced'
    }],
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: true
  },
  {
    title: 'Elementary School Teacher',
    company: 'London Education Board',
    location: 'London, UK',
    country: 'UK',
    salary: '£35,000 - £45,000 GBP',
    type: 'Full-time',
    category: 'Education',
    skills: ['Curriculum Development', 'Classroom Management', 'Student Assessment', 'Educational Technology'],
    description: 'Shape young minds in our progressive educational environment. We seek a dedicated teacher to inspire and educate the next generation.',
    requirements: [
      'Teaching degree or equivalent qualification',
      'QTS (Qualified Teacher Status) certification',
      'Experience working with children aged 5-11',
      'Strong classroom management skills',
      'Commitment to inclusive education'
    ],
    benefits: [
      'Teachers\' pension scheme',
      'Professional development opportunities',
      'Visa sponsorship for qualified candidates',
      'School holiday benefits',
      'Supportive work environment'
    ],
    visaSponsorship: true,
    relocationAssistance: false,
    experienceLevel: 'Mid',
    educationLevel: 'Bachelor',
    languageRequirements: [{
      language: 'English',
      proficiency: 'Native'
    }],
    applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: false
  },
  {
    title: 'Corporate Lawyer',
    company: 'Berlin Legal Associates',
    location: 'Berlin, Germany',
    country: 'Germany',
    salary: '€65,000 - €85,000 EUR',
    type: 'Full-time',
    category: 'Legal',
    skills: ['Contract Law', 'Corporate Governance', 'Legal Research', 'Mergers & Acquisitions'],
    description: 'Handle complex corporate legal matters for international clients. Join our prestigious law firm and advance your legal career.',
    requirements: [
      'Law degree from accredited institution',
      'Bar admission in home country',
      '5+ years of corporate law experience',
      'Fluency in English and German preferred',
      'Strong analytical and negotiation skills'
    ],
    benefits: [
      'Competitive salary with performance bonuses',
      'Health insurance coverage',
      'Work permit assistance',
      'International client exposure',
      'Partnership track opportunities'
    ],
    visaSponsorship: true,
    relocationAssistance: true,
    experienceLevel: 'Senior',
    educationLevel: 'Master',
    languageRequirements: [{
      language: 'English',
      proficiency: 'Advanced'
    }, {
      language: 'German',
      proficiency: 'Intermediate'
    }],
    applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: true
  },
  {
    title: 'HR Manager',
    company: 'Sydney Business Solutions',
    location: 'Sydney, Australia',
    country: 'Australia',
    salary: '$75,000 - $95,000 AUD',
    type: 'Full-time',
    category: 'Human Resources',
    skills: ['Recruitment', 'Employee Relations', 'Performance Management', 'HR Analytics'],
    description: 'Lead HR initiatives for our growing organization. Drive talent acquisition, employee engagement, and organizational development.',
    requirements: [
      'Bachelor\'s degree in HR or related field',
      'SHRM or equivalent certification preferred',
      '5+ years of HR management experience',
      'Strong leadership and communication skills',
      'Experience with HRIS systems'
    ],
    benefits: [
      'Superannuation with employer contributions',
      'Flexible work arrangements',
      'Visa sponsorship available',
      'Professional development budget',
      'Annual leave loading'
    ],
    visaSponsorship: true,
    relocationAssistance: true,
    experienceLevel: 'Senior',
    educationLevel: 'Bachelor',
    languageRequirements: [{
      language: 'English',
      proficiency: 'Advanced'
    }],
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: false
  }
];

const seedAssessments = [
  {
    type: 'general',
    category: 'General Knowledge',
    score: 85,
    maxScore: 100,
    timeSpent: 45,
    answers: [
      {
        questionId: 'q1',
        question: 'What is the capital of Canada?',
        answer: 'Ottawa',
        correctAnswer: 'Ottawa',
        isCorrect: true,
        timeSpent: 15
      },
      {
        questionId: 'q2',
        question: 'Which programming language is known for web development?',
        answer: 'JavaScript',
        correctAnswer: 'JavaScript',
        isCorrect: true,
        timeSpent: 12
      }
    ],
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    isValid: true,
    attempts: 1
  }
];

const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await Database.connectMongoDB();

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      logger.info(`👥 Found ${existingUsers} existing users, skipping user seeding`);
      process.exit(0);
    }

    // Create users
    logger.info('👥 Creating users...');
    const createdUsers = await User.create(seedUsers);
    logger.info(`✅ Created ${createdUsers.length} users`);

    // Find company user for job posting
    const companyUser = createdUsers.find(user => user.role === 'company');
    const demoUser = createdUsers.find(user => user.email === 'demo@aura.com');

    // Create jobs
    logger.info('💼 Creating jobs...');
    const jobsWithPostedBy = seedJobs.map(job => ({
      ...job,
      postedBy: companyUser!._id
    }));
    const createdJobs = await Job.create(jobsWithPostedBy);
    logger.info(`✅ Created ${createdJobs.length} jobs`);

    // Create sample applications
    logger.info('📝 Creating applications...');
    const sampleApplications = [
      {
        userId: demoUser!._id,
        jobId: createdJobs[0]._id,
        status: 'reviewing',
        coverLetter: 'I am very interested in this position and believe my skills in React and Node.js make me a great fit.',
        matchScore: 95,
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: createdUsers[3]._id, // John Doe
        jobId: createdJobs[1]._id,
        status: 'interview',
        coverLetter: 'As a healthcare professional, I am excited about the opportunity to work in Canada.',
        matchScore: 78,
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        interviewScheduled: {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'video',
          meetingLink: 'https://zoom.us/j/123456789',
          notes: 'Technical interview with the development team'
        }
      }
    ];

    const createdApplications = await Application.create(sampleApplications);
    logger.info(`✅ Created ${createdApplications.length} applications`);

    // Update job application counts
    await Job.findByIdAndUpdate(createdJobs[0]._id, { $inc: { applicationCount: 1 } });
    await Job.findByIdAndUpdate(createdJobs[1]._id, { $inc: { applicationCount: 1 } });

    // Create assessments
    logger.info('📊 Creating assessments...');
    const assessmentsWithUserId = seedAssessments.map(assessment => ({
      ...assessment,
      userId: demoUser!._id
    }));
    const createdAssessments = await Assessment.create(assessmentsWithUserId);
    logger.info(`✅ Created ${createdAssessments.length} assessments`);

    logger.info('🎉 Database seeding completed successfully!');
    logger.info(`
📊 Seeding Summary:
   👥 Users: ${createdUsers.length}
   💼 Jobs: ${createdJobs.length}
   📝 Applications: ${createdApplications.length}
   📊 Assessments: ${createdAssessments.length}

🔐 Test Credentials:
   Demo User: demo@aura.com / demo1234
   Admin User: admin@aura.com / admin1234
   Company User: company@techcorp.com / company1234
    `);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();