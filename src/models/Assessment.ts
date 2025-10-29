import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'general' | 'technical' | 'language' | 'personality';
  category?: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // in minutes
  answers: {
    questionId: string;
    question: string;
    answer: string;
    correctAnswer?: string;
    isCorrect: boolean;
    timeSpent: number; // in seconds
  }[];
  startedAt: Date;
  completedAt: Date;
  isValid: boolean;
  attempts: number;
  ipAddress?: string;
  userAgent?: string;
}

const assessmentSchema = new Schema<IAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['general', 'technical', 'language', 'personality'],
    required: [true, 'Assessment type is required']
  },
  category: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: 1
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: 0
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    correctAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  startedAt: {
    type: Date,
    required: [true, 'Start time is required']
  },
  completedAt: {
    type: Date,
    required: [true, 'Completion time is required']
  },
  isValid: {
    type: Boolean,
    default: true
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assessmentSchema.index({ userId: 1, type: 1 });
assessmentSchema.index({ userId: 1 });
assessmentSchema.index({ type: 1 });
assessmentSchema.index({ completedAt: -1 });
assessmentSchema.index({ percentage: -1 });

// Pre-save middleware to calculate percentage
assessmentSchema.pre('save', function(next) {
  if (this.maxScore > 0) {
    this.percentage = Math.round((this.score / this.maxScore) * 100);
  }
  next();
});

// Virtual for assessment duration
assessmentSchema.virtual('duration').get(function() {
  return this.completedAt.getTime() - this.startedAt.getTime();
});

// Virtual for grade
assessmentSchema.virtual('grade').get(function() {
  if (this.percentage >= 90) return 'A+';
  if (this.percentage >= 80) return 'A';
  if (this.percentage >= 70) return 'B';
  if (this.percentage >= 60) return 'C';
  if (this.percentage >= 50) return 'D';
  return 'F';
});

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);