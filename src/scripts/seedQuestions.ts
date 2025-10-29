import dotenv from 'dotenv';
dotenv.config();

import Database from '../config/database';
import Question from '../models/Question';
import User from '../models/User';
import logger from '../config/logger';

const generateQuestions = () => {
  const categories = [
    'General Knowledge', 'Technology', 'Software Engineering', 'Programming', 
    'Financial Accounting', 'Data Analysis', 'Project Management', 'Healthcare',
    'Education', 'Legal', 'Human Resources', 'Marketing'
  ];

  const questions = [];

  categories.forEach(category => {
    // Generate 20 objective questions per category
    for (let i = 1; i <= 20; i++) {
      questions.push({
        type: 'objective',
        category,
        difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
        question: `${category} objective question ${i}: What is the most important concept in ${category.toLowerCase()}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: `This is the explanation for ${category} question ${i}.`,
        timeLimit: 60 + (i * 5),
        points: i <= 7 ? 1 : i <= 14 ? 2 : 3,
        tags: [category.toLowerCase().replace(' ', '-'), 'objective']
      });
    }

    // Generate 20 theory questions per category
    for (let i = 1; i <= 20; i++) {
      questions.push({
        type: 'theory',
        category,
        difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
        question: `${category} theory question ${i}: Explain the key principles of ${category.toLowerCase()}.`,
        correctAnswer: `Key principles of ${category} include fundamental concepts, best practices, and industry standards.`,
        explanation: `This theory question tests understanding of ${category} principles.`,
        timeLimit: 300 + (i * 30),
        points: i <= 7 ? 3 : i <= 14 ? 5 : 8,
        tags: [category.toLowerCase().replace(' ', '-'), 'theory']
      });
    }

    // Generate 20 practical questions per category
    for (let i = 1; i <= 20; i++) {
      questions.push({
        type: 'practical',
        category,
        difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
        question: `${category} practical scenario ${i}: How would you handle a complex situation in ${category.toLowerCase()}?`,
        correctAnswer: `Analyze the situation, identify key factors, develop solutions, implement best practices, and monitor results.`,
        explanation: `This practical question evaluates problem-solving skills in ${category}.`,
        timeLimit: 600 + (i * 60),
        points: i <= 7 ? 5 : i <= 14 ? 8 : 12,
        tags: [category.toLowerCase().replace(' ', '-'), 'practical']
      });
    }
  });

  // Add specialized questions for technical categories
  const technicalCategories = ['Technology', 'Software Engineering', 'Programming'];
  technicalCategories.forEach(category => {
    for (let i = 1; i <= 20; i++) {
      questions.push({
        type: 'code',
        category,
        difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
        question: `${category} coding challenge ${i}: Write a function to solve this problem.`,
        codeTemplate: `function solution() {\n  // Your code here\n  return result;\n}`,
        testCases: [
          { input: 'test1', expectedOutput: 'result1' },
          { input: 'test2', expectedOutput: 'result2' }
        ],
        correctAnswer: `function solution() { return 'correct implementation'; }`,
        timeLimit: 900 + (i * 60),
        points: i <= 7 ? 8 : i <= 14 ? 12 : 15,
        tags: [category.toLowerCase().replace(' ', '-'), 'coding']
      });
    }
  });

  // Add specialized questions for accounting
  for (let i = 1; i <= 20; i++) {
    questions.push({
      type: 'accounting',
      category: 'Financial Accounting',
      difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
      question: `Accounting problem ${i}: Calculate the financial metric for the given scenario.`,
      correctAnswer: (1000 + i * 100).toString(),
      explanation: `This accounting question tests financial calculation skills.`,
      timeLimit: 240 + (i * 30),
      points: i <= 7 ? 3 : i <= 14 ? 5 : 8,
      tags: ['accounting', 'calculation']
    });
  }

  // Add specialized questions for data analysis
  for (let i = 1; i <= 20; i++) {
    questions.push({
      type: 'excel',
      category: 'Data Analysis',
      difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
      question: `Excel task ${i}: Create analysis from the provided dataset.`,
      excelData: {
        spreadsheetUrl: `/sample-data/dataset-${i}.xlsx`,
        instructions: `Analyze the data and create appropriate charts and pivot tables.`
      },
      correctAnswer: `Proper data analysis with charts, pivot tables, and insights.`,
      timeLimit: 900 + (i * 120),
      points: i <= 7 ? 10 : i <= 14 ? 15 : 20,
      tags: ['excel', 'data-analysis']
    });
  }

  return questions;
};

const seedQuestions = async () => {
  try {
    logger.info('🌱 Starting questions seeding...');

    await Database.connectMongoDB();

    // Check if questions already exist
    const existingCount = await Question.countDocuments();
    if (existingCount > 0) {
      logger.info(`📋 Found ${existingCount} existing questions, skipping question seeding`);
      process.exit(0);
    }

    // Find admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run user seeding first.');
    }

    // Generate comprehensive questions
    const allQuestions = generateQuestions();
    logger.info(`📝 Generated ${allQuestions.length} questions`);

    // Add createdBy field to all questions
    const questionsWithCreator = allQuestions.map(question => ({
      ...question,
      createdBy: adminUser._id,
      isActive: true
    }));

    // Create questions in batches to avoid memory issues
    const batchSize = 100;
    let createdCount = 0;
    
    for (let i = 0; i < questionsWithCreator.length; i += batchSize) {
      const batch = questionsWithCreator.slice(i, i + batchSize);
      await Question.create(batch);
      createdCount += batch.length;
      logger.info(`✅ Created batch: ${createdCount}/${questionsWithCreator.length} questions`);
    }

    // Get final counts by type and category
    const questionCounts = await Question.aggregate([
      { $group: { _id: { type: '$type', category: '$category' }, count: { $sum: 1 } } },
      { $sort: { '_id.category': 1, '_id.type': 1 } }
    ]);

    logger.info('🎉 Questions seeding completed successfully!');
    logger.info(`\n📊 Questions Summary (${createdCount} total):`);
    
    const typeGroups = {};
    questionCounts.forEach(item => {
      const type = item._id.type;
      if (!typeGroups[type]) typeGroups[type] = 0;
      typeGroups[type] += item.count;
    });

    Object.entries(typeGroups).forEach(([type, count]) => {
      logger.info(`   ${getTypeIcon(type)} ${type}: ${count}`);
    });

    logger.info('\n📋 Questions per category (minimum 20 each):');
    const categoryGroups = {};
    questionCounts.forEach(item => {
      const category = item._id.category;
      if (!categoryGroups[category]) categoryGroups[category] = 0;
      categoryGroups[category] += item.count;
    });

    Object.entries(categoryGroups).forEach(([category, count]) => {
      logger.info(`   📚 ${category}: ${count} questions`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('❌ Questions seeding failed:', error);
    process.exit(1);
  }
};

const getTypeIcon = (type: string) => {
  const icons = {
    'objective': '📝',
    'theory': '📖',
    'code': '💻',
    'accounting': '💰',
    'excel': '📊',
    'practical': '🎯'
  };
  return icons[type] || '❓';
};

seedQuestions();