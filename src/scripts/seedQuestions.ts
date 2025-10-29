import dotenv from 'dotenv';
dotenv.config();

import Database from '../config/database';
import Question from '../models/Question';
import User from '../models/User';
import logger from '../config/logger';

const sampleQuestions = [
  // Objective Questions
  {
    type: 'objective',
    category: 'General Knowledge',
    difficulty: 'easy',
    question: 'What is the capital of Canada?',
    options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
    correctAnswer: 'Ottawa',
    explanation: 'Ottawa is the capital city of Canada.',
    timeLimit: 60,
    points: 1,
    tags: ['geography', 'canada']
  },
  {
    type: 'objective',
    category: 'Technology',
    difficulty: 'medium',
    question: 'Which of the following is NOT a JavaScript framework?',
    options: ['React', 'Angular', 'Vue', 'Laravel'],
    correctAnswer: 'Laravel',
    explanation: 'Laravel is a PHP framework, not a JavaScript framework.',
    timeLimit: 90,
    points: 2,
    tags: ['javascript', 'frameworks']
  },
  
  // Theory Questions
  {
    type: 'theory',
    category: 'Software Engineering',
    difficulty: 'medium',
    question: 'Explain the concept of Object-Oriented Programming and its main principles.',
    correctAnswer: 'Object-Oriented Programming (OOP) is a programming paradigm based on objects and classes. Main principles: Encapsulation, Inheritance, Polymorphism, Abstraction',
    explanation: 'OOP organizes code into objects that contain data and methods.',
    timeLimit: 300,
    points: 5,
    tags: ['oop', 'programming', 'concepts']
  },
  
  // Code Questions
  {
    type: 'code',
    category: 'Programming',
    difficulty: 'medium',
    question: 'Write a function that returns the factorial of a given number.',
    codeTemplate: 'function factorial(n) {\n  // Your code here\n}',
    testCases: [
      { input: '5', expectedOutput: '120' },
      { input: '0', expectedOutput: '1' },
      { input: '3', expectedOutput: '6' }
    ],
    correctAnswer: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }',
    timeLimit: 600,
    points: 10,
    tags: ['javascript', 'recursion', 'math']
  },
  
  // Accounting Questions
  {
    type: 'accounting',
    category: 'Financial Accounting',
    difficulty: 'medium',
    question: 'Calculate the depreciation expense for equipment costing $50,000 with a useful life of 5 years and salvage value of $5,000 using straight-line method.',
    correctAnswer: '9000',
    explanation: 'Depreciation = (Cost - Salvage Value) / Useful Life = (50000 - 5000) / 5 = $9,000',
    timeLimit: 240,
    points: 3,
    tags: ['depreciation', 'accounting', 'calculation']
  },
  
  // Excel Questions
  {
    type: 'excel',
    category: 'Data Analysis',
    difficulty: 'hard',
    question: 'Create a pivot table from the given sales data and calculate total sales by region and product category.',
    excelData: {
      spreadsheetUrl: '/sample-data/sales-data.xlsx',
      instructions: 'Use the provided sales data to create a pivot table showing total sales by region and product category. Include percentage of total sales for each combination.'
    },
    correctAnswer: 'Pivot table with Region and Product Category as rows, Sum of Sales as values, with percentage calculations',
    timeLimit: 900,
    points: 15,
    tags: ['excel', 'pivot-table', 'data-analysis']
  },
  
  // Practical Questions
  {
    type: 'practical',
    category: 'Project Management',
    difficulty: 'hard',
    question: 'You are managing a software development project that is behind schedule. The client wants to add new features, but your team is already overloaded. How would you handle this situation?',
    correctAnswer: 'Assess impact, communicate with stakeholders, prioritize features, negotiate timeline or scope, document decisions, implement change management process',
    explanation: 'Effective project management requires balancing scope, time, and resources while maintaining stakeholder communication.',
    timeLimit: 600,
    points: 8,
    tags: ['project-management', 'communication', 'problem-solving']
  }
];

const seedQuestions = async () => {
  try {
    logger.info('🌱 Starting questions seeding...');

    await Database.connectMongoDB();

    // Find admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run user seeding first.');
    }

    // Clear existing questions
    await Question.deleteMany({});
    logger.info('🗑️  Cleared existing questions');

    // Add createdBy field to all questions
    const questionsWithCreator = sampleQuestions.map(question => ({
      ...question,
      createdBy: adminUser._id,
      isActive: true
    }));

    // Create questions
    const createdQuestions = await Question.create(questionsWithCreator);
    logger.info(`✅ Created ${createdQuestions.length} questions`);

    logger.info('🎉 Questions seeding completed successfully!');
    logger.info(`
📊 Questions Summary:
   📝 Objective: ${createdQuestions.filter(q => q.type === 'objective').length}
   📖 Theory: ${createdQuestions.filter(q => q.type === 'theory').length}
   💻 Code: ${createdQuestions.filter(q => q.type === 'code').length}
   💰 Accounting: ${createdQuestions.filter(q => q.type === 'accounting').length}
   📊 Excel: ${createdQuestions.filter(q => q.type === 'excel').length}
   🎯 Practical: ${createdQuestions.filter(q => q.type === 'practical').length}
    `);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Questions seeding failed:', error);
    process.exit(1);
  }
};

seedQuestions();