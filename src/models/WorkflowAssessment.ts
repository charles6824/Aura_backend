import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkflowAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  questionIds: mongoose.Types.ObjectId[];
  timeLimit: number; // in seconds
  cutoffScore: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'expired';
  answers?: {
    questionId: string;
    answer: string;
    timeSpent: number;
  }[];
  score?: number;
  maxScore?: number;
  timeSpent?: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const workflowAssessmentSchema = new Schema<IWorkflowAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  questionIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  timeLimit: {
    type: Number,
    required: true,
    min: 300 // minimum 5 minutes
  },
  cutoffScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'expired'],
    default: 'scheduled'
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    timeSpent: {
      type: Number,
      required: true
    }
  }],
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  maxScore: {
    type: Number,
    min: 0
  },
  timeSpent: {
    type: Number,
    min: 0
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
workflowAssessmentSchema.index({ userId: 1 });
workflowAssessmentSchema.index({ applicationId: 1 });
workflowAssessmentSchema.index({ jobId: 1 });
workflowAssessmentSchema.index({ status: 1 });

export default mongoose.model<IWorkflowAssessment>('WorkflowAssessment', workflowAssessmentSchema);