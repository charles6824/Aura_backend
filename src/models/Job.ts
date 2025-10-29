import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  companyId?: mongoose.Types.ObjectId;
  location: string;
  country: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  category: string;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  visaSponsorship: boolean;
  relocationAssistance: boolean;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Executive';
  educationLevel: 'High School' | 'Bachelor' | 'Master' | 'PhD' | 'Any';
  languageRequirements: {
    language: string;
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
  }[];
  assessmentRequired: boolean;
  assessmentCutoffScore: number;
  assessmentFee?: number;
  documentProcessingFee?: number;
  visaProcessingFee?: number;
  applicationDeadline?: Date;
  startDate?: Date;
  contractDuration?: string;
  accommodationProvided: boolean;
  flightTicketProvided: boolean;
  isActive: boolean;
  isUrgent: boolean;
  viewCount: number;
  applicationCount: number;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  salary: {
    type: String,
    required: [true, 'Salary range is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: [true, 'Job type is required']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  visaSponsorship: {
    type: Boolean,
    default: false
  },
  relocationAssistance: {
    type: Boolean,
    default: false
  },
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Executive'],
    required: [true, 'Experience level is required']
  },
  educationLevel: {
    type: String,
    enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Any'],
    default: 'Any'
  },
  languageRequirements: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced', 'Native'],
      required: true
    }
  }],
  assessmentRequired: {
    type: Boolean,
    default: true
  },
  assessmentCutoffScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 70
  },
  assessmentFee: {
    type: Number,
    min: 0
  },
  documentProcessingFee: {
    type: Number,
    min: 0
  },
  visaProcessingFee: {
    type: Number,
    min: 0
  },
  applicationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  contractDuration: {
    type: String,
    trim: true
  },
  accommodationProvided: {
    type: Boolean,
    default: false
  },
  flightTicketProvided: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ category: 1 });
jobSchema.index({ country: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ visaSponsorship: 1 });

// Virtual for days since posted
jobSchema.virtual('daysSincePosted').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for application deadline status
jobSchema.virtual('isDeadlinePassed').get(function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
});

export default mongoose.model<IJob>('Job', jobSchema);