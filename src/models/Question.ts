import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  type: 'objective' | 'theory' | 'code' | 'accounting' | 'excel' | 'practical' | 'essay' | 'file_upload';
  category: string;
  subcategory?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  questionMedia?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    description?: string;
  }[];
  options?: {
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  correctAnswer: string | string[];
  explanation?: string;
  hints?: string[];
  codeTemplate?: string;
  allowedLanguages?: string[];
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }[];
  excelData?: {
    spreadsheetUrl: string;
    instructions: string;
    expectedResult: string;
  };
  fileUploadRequirements?: {
    allowedTypes: string[];
    maxSize: number;
    instructions: string;
  };
  timeLimit: number;
  points: number;
  negativeMarking: boolean;
  negativePoints?: number;
  tags: string[];
  prerequisites?: mongoose.Types.ObjectId[];
  isActive: boolean;
  isProctored: boolean;
  allowCalculator: boolean;
  allowNotes: boolean;
  randomizeOptions: boolean;
  createdBy: mongoose.Types.ObjectId;
  usageCount: number;
  averageScore: number;
  successRate: number;
}

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['objective', 'theory', 'code', 'accounting', 'excel', 'practical', 'essay', 'file_upload'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 2000
  },
  questionMedia: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    description: String
  }],
  options: [{
    text: {
      type: String,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: String
  }],
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: true
  },
  hints: [String],
  explanation: {
    type: String,
    maxlength: 1000
  },
  codeTemplate: {
    type: String
  },
  allowedLanguages: [String],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  excelData: {
    spreadsheetUrl: String,
    instructions: String,
    expectedResult: String
  },
  fileUploadRequirements: {
    allowedTypes: [String],
    maxSize: Number,
    instructions: String
  },
  timeLimit: {
    type: Number,
    default: 300, // 5 minutes
    min: 30
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  negativePoints: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isProctored: {
    type: Boolean,
    default: false
  },
  allowCalculator: {
    type: Boolean,
    default: false
  },
  allowNotes: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

questionSchema.index({ type: 1, category: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });

export default mongoose.model<IQuestion>('Question', questionSchema);