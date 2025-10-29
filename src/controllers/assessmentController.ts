import { Request, Response, NextFunction } from 'express';
import Assessment from '../models/Assessment';
import Question from '../models/Question';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import cacheService from '../utils/cache';

/**
 * @swagger
 * /assessments/questions:
 *   get:
 *     summary: Get assessment questions by type
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [objective, theory, code, accounting, excel, practical]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 */
export const getAssessmentQuestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { type, category, difficulty, count = 20 } = req.query;

    if (!type) {
      return next(new AppError('Assessment type is required', 400));
    }

    // Check cache first
    const cacheKey = `questions:${type}:${category || 'all'}:${difficulty || 'all'}:${count}`;
    const cachedQuestions = await cacheService.get(cacheKey);
    if (cachedQuestions) {
      return res.json({
        success: true,
        data: { questions: cachedQuestions }
      });
    }

    const filter: any = { type, isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(count as string) } },
      {
        $project: {
          _id: 1,
          type: 1,
          category: 1,
          difficulty: 1,
          question: 1,
          options: 1,
          codeTemplate: 1,
          testCases: 1,
          excelData: 1,
          timeLimit: 1,
          points: 1,
          tags: 1
          // Exclude correctAnswer and explanation for security
        }
      }
    ]);

    // Cache questions for 2 hours
    await cacheService.set(cacheKey, questions, 7200);

    res.json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /assessments/submit:
 *   post:
 *     summary: Submit assessment answers
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - answers
 *               - timeSpent
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [objective, theory, code, accounting, excel, practical]
 *               category:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *                     timeSpent:
 *                       type: number
 *               timeSpent:
 *                 type: number
 *     responses:
 *       201:
 *         description: Assessment submitted successfully
 */
export const submitAssessment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { type, category, answers, timeSpent } = req.body;
    const userId = req.user!._id as any;

    // Get questions with correct answers
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== answers.length) {
      return next(new AppError('Invalid questions provided', 400));
    }

    // Calculate score
    let score = 0;
    let maxScore = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      const question = questions.find(q => (q._id as any).toString() === answer.questionId);
      if (!question) continue;

      maxScore += question.points;
      let isCorrect = false;

      // Different scoring logic based on question type
      switch (question.type) {
        case 'objective':
          const userAnswer = typeof answer.answer === 'string' ? answer.answer : answer.answer[0] || '';
          const correctAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : question.correctAnswer[0] || '';
          isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          break;
        
        case 'code':
          // For code questions, run test cases
          isCorrect = await evaluateCodeAnswer(answer.answer, question.testCases || []);
          break;
        
        case 'theory':
        case 'accounting':
        case 'excel':
        case 'practical':
          // For subjective questions, use keyword matching or manual review
          const subjAnswer = typeof answer.answer === 'string' ? answer.answer : answer.answer.join(' ');
          const subjCorrect = typeof question.correctAnswer === 'string' ? question.correctAnswer : question.correctAnswer.join(' ');
          isCorrect = await evaluateSubjectiveAnswer(subjAnswer, subjCorrect);
          break;
      }

      if (isCorrect) {
        score += question.points;
      }

      processedAnswers.push({
        questionId: answer.questionId,
        question: question.question,
        answer: answer.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      });
    }

    // Create assessment record
    const assessment = await Assessment.create({
      userId,
      type,
      category,
      score,
      maxScore,
      timeSpent,
      answers: processedAnswers,
      startedAt: new Date(Date.now() - timeSpent * 60 * 1000),
      completedAt: new Date(),
      isValid: true,
      attempts: 1
    });

    // Update user assessment status
    if (assessment.percentage >= 70) {
      await User.findByIdAndUpdate(userId, { assessmentCompleted: true });
    }

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        assessment: {
          _id: assessment._id,
          score: assessment.score,
          maxScore: assessment.maxScore,
          percentage: assessment.percentage,
          grade: assessment.get('grade'),
          timeSpent: assessment.timeSpent,
          completedAt: assessment.completedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /assessments/results:
 *   get:
 *     summary: Get user assessment results
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 */
export const getAssessmentResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id as any;
    const { type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = { userId };
    if (type) filter.type = type;

    const assessments = await Assessment.find(filter)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('-answers.correctAnswer'); // Hide correct answers

    const total = await Assessment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          total,
          hasNext: skip + assessments.length < total,
          hasPrev: parseInt(page as string) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /assessments/stats:
 *   get:
 *     summary: Get assessment statistics
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment statistics retrieved successfully
 */
export const getAssessmentStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id as any;

    const stats = await Assessment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
          totalTimeSpent: { $sum: '$timeSpent' }
        }
      }
    ]);

    const overallStats = await Assessment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalAssessments: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalTimeSpent: { $sum: '$timeSpent' },
          passedAssessments: {
            $sum: { $cond: [{ $gte: ['$percentage', 70] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        overall: overallStats[0] || {
          totalAssessments: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          passedAssessments: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const evaluateCodeAnswer = async (code: string, testCases: any[]): Promise<boolean> => {
  // Simple code evaluation - in production, use a sandboxed environment
  try {
    for (const testCase of testCases) {
      // This is a simplified example - implement proper code execution
      const result = eval(`(${code})(${testCase.input})`);
      if (result.toString() !== testCase.expectedOutput) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
};

const evaluateSubjectiveAnswer = async (answer: string, correctAnswer: string): Promise<boolean> => {
  // Simple keyword matching - in production, use NLP or manual review
  const answerWords = answer.toLowerCase().split(/\s+/);
  const correctWords = correctAnswer.toLowerCase().split(/\s+/);
  
  const matchCount = answerWords.filter(word => 
    correctWords.some(correctWord => 
      correctWord.includes(word) || word.includes(correctWord)
    )
  ).length;
  
  return matchCount / correctWords.length >= 0.6; // 60% keyword match
};