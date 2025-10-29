import { Request, Response, NextFunction } from 'express';
import Job from '../models/Job';
import Application from '../models/Application';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import cacheService from '../utils/cache';

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs with filtering and pagination
 *     tags: [Jobs]
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 */
export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = { isActive: true };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.country) filter.country = req.query.country;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.visaSponsorship) filter.visaSponsorship = req.query.visaSponsorship === 'true';
    if (req.query.experienceLevel) filter.experienceLevel = req.query.experienceLevel;

    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    // Get jobs with pagination
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1, ...(req.query.search && { score: { $meta: 'textScore' } }) })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalJobs: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs/matches:
 *   get:
 *     summary: Get job matches for authenticated user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job matches retrieved successfully
 */
export const getJobMatches = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = (req.user!._id as any).toString();

    // Check cache first
    const cachedMatches = await cacheService.getCachedJobMatches(userId);
    if (cachedMatches) {
      return res.json({
        success: true,
        data: { matches: cachedMatches }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Build matching criteria based on user profile
    const matchCriteria: any = { isActive: true };

    // Match by preferred countries
    if (user.preferredCountries && user.preferredCountries.length > 0) {
      matchCriteria.country = { $in: user.preferredCountries };
    }

    // Match by skills
    if (user.skills && user.skills.length > 0) {
      matchCriteria.skills = { $in: user.skills };
    }

    // Match by experience level
    if (user.experience !== undefined) {
      const experienceLevel = (user.experience || 0) < 2 ? 'Entry' : 
                            (user.experience || 0) < 5 ? 'Mid' : 
                            (user.experience || 0) < 10 ? 'Senior' : 'Executive';
      matchCriteria.experienceLevel = { $in: ['Entry', experienceLevel] };
    }

    const jobs = await Job.find(matchCriteria)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate match scores
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      let maxScore = 0;

      // Country match (30 points)
      maxScore += 30;
      if (user.preferredCountries?.includes(job.country)) {
        score += 30;
      }

      // Skills match (40 points)
      maxScore += 40;
      if (user.skills && job.skills) {
        const matchingSkills = user.skills.filter(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        score += Math.min((matchingSkills.length / Math.max(job.skills.length, 1)) * 40, 40);
      }

      // Experience match (20 points)
      maxScore += 20;
      const userExpLevel = (user.experience || 0) < 2 ? 'Entry' : 
                          (user.experience || 0) < 5 ? 'Mid' : 
                          (user.experience || 0) < 10 ? 'Senior' : 'Executive';
      if (job.experienceLevel === userExpLevel || job.experienceLevel === 'Entry') {
        score += 20;
      }

      // Visa sponsorship (10 points)
      maxScore += 10;
      if (job.visaSponsorship) {
        score += 10;
      }

      const matchPercentage = Math.round((score / maxScore) * 100);

      return {
        ...job.toObject(),
        matchScore: matchPercentage
      };
    });

    // Sort by match score
    const sortedMatches = jobsWithScores
      .filter(job => job.matchScore >= 50) // Only show jobs with 50%+ match
      .sort((a, b) => b.matchScore - a.matchScore);

    // Cache the results
    await cacheService.cacheJobMatches(userId, sortedMatches);

    res.json({
      success: true,
      data: { matches: sortedMatches }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       404:
 *         description: Job not found
 */
export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email');

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Increment view count
    job.viewCount += 1;
    await job.save();

    res.json({
      success: true,
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job (Admin/Company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       403:
 *         description: Insufficient permissions
 */
export const createJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user!._id as any
    };

    const job = await Job.create(jobData);
    await job.populate('postedBy', 'name email');

    // Invalidate job cache
    await cacheService.del('job_stats');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Update job (Admin/Company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       404:
 *         description: Job not found
 */
export const updateJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if user owns the job or is admin
    if ((job.postedBy as any).toString() !== (req.user!._id as any).toString() && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized to update this job', 403));
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Delete job (Admin/Company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       404:
 *         description: Job not found
 */
export const deleteJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if user owns the job or is admin
    if ((job.postedBy as any).toString() !== (req.user!._id as any).toString() && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized to delete this job', 403));
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /jobs/stats:
 *   get:
 *     summary: Get job statistics
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
 */
export const getJobStats = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Check cache first
    const cachedStats = await cacheService.getCachedJobStats();
    if (cachedStats) {
      return res.json({
        success: true,
        data: cachedStats
      });
    }

    const stats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalViews: { $sum: '$viewCount' },
          totalApplications: { $sum: '$applicationCount' }
        }
      }
    ]);

    const categoryStats = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const countryStats = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      overview: stats[0] || { totalJobs: 0, activeJobs: 0, totalViews: 0, totalApplications: 0 },
      byCategory: categoryStats,
      byCountry: countryStats
    };

    // Cache the results
    await cacheService.cacheJobStats(result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};