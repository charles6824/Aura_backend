import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'assessment_pending' | 'assessment_completed' | 'offer_sent' | 'offer_accepted' | 'documents_pending' | 'visa_processing' | 'completed';
  currentStep: 'application' | 'assessment' | 'document_submission' | 'visa_processing' | 'relocation' | 'completed';
  paymentStatus: {
    assessment: 'not_required' | 'required' | 'pending' | 'paid' | 'failed';
    document_processing: 'not_required' | 'required' | 'pending' | 'paid' | 'failed';
    visa_processing: 'not_required' | 'required' | 'pending' | 'paid' | 'failed';
  };
  paymentGates: {
    assessmentBlocked: boolean;
    documentSubmissionBlocked: boolean;
    visaProcessingBlocked: boolean;
  };
  coverLetter?: string;
  resume?: string;
  additionalDocuments?: {
    name: string;
    url: string;
    type: string;
  }[];
  matchScore?: number;
  assessmentScore?: number;
  assessmentCompleted?: boolean;
  assessmentCutoffScore?: number;
  assessmentPassed?: boolean;
  assessmentSecurityData?: {
    violations: {
      type: string;
      timestamp: Date;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }[];
    sessionId: string;
    browserFingerprint: string;
    ipAddress: string;
    timeSpent: number;
    tabSwitches: number;
    submissionType: 'manual' | 'automatic';
  };
  documentsVerified?: boolean;
  documentsSubmitted?: boolean;
  requiredDocuments?: {
    passport: boolean;
    degree: boolean;
    transcript: boolean;
    experience_letter: boolean;
    language_certificate: boolean;
    medical_report: boolean;
    police_clearance: boolean;
  };
  generatedDocuments?: {
    employmentContract?: string;
    visaInvitation?: string;
    workPermitLetter?: string;
    accommodationLetter?: string;
    flightBooking?: string;
    signedContract?: string;
  };
  notes?: {
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  interviewScheduled?: {
    date: Date;
    type: 'phone' | 'video' | 'in-person';
    location?: string;
    meetingLink?: string;
    notes?: string;
  };
  offerDetails?: {
    salary: string;
    startDate: Date;
    benefits: string[];
    conditions: string[];
    expiryDate: Date;
  };
  rejectionReason?: string;
  appliedAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'assessment_pending', 'assessment_completed', 'offer_sent', 'offer_accepted', 'documents_pending', 'visa_processing', 'completed'],
    default: 'pending'
  },
  currentStep: {
    type: String,
    enum: ['application', 'assessment', 'document_submission', 'visa_processing', 'relocation', 'completed'],
    default: 'application'
  },
  paymentStatus: {
    assessment: {
      type: String,
      enum: ['not_required', 'required', 'pending', 'paid', 'failed'],
      default: 'not_required'
    },
    document_processing: {
      type: String,
      enum: ['not_required', 'required', 'pending', 'paid', 'failed'],
      default: 'not_required'
    },
    visa_processing: {
      type: String,
      enum: ['not_required', 'required', 'pending', 'paid', 'failed'],
      default: 'not_required'
    }
  },
  paymentGates: {
    assessmentBlocked: {
      type: Boolean,
      default: true
    },
    documentSubmissionBlocked: {
      type: Boolean,
      default: true
    },
    visaProcessingBlocked: {
      type: Boolean,
      default: true
    }
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  resume: {
    type: String
  },
  additionalDocuments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  assessmentScore: {
    type: Number,
    min: 0,
    max: 100
  },
  assessmentCompleted: {
    type: Boolean,
    default: false
  },
  assessmentCutoffScore: {
    type: Number,
    min: 0,
    max: 100
  },
  assessmentPassed: {
    type: Boolean,
    default: false
  },
  assessmentSecurityData: {
    violations: [{
      type: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        required: true
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    sessionId: {
      type: String
    },
    browserFingerprint: {
      type: String
    },
    ipAddress: {
      type: String
    },
    timeSpent: {
      type: Number
    },
    tabSwitches: {
      type: Number,
      default: 0
    },
    submissionType: {
      type: String,
      enum: ['manual', 'automatic']
    }
  },
  documentsVerified: {
    type: Boolean,
    default: false
  },
  documentsSubmitted: {
    type: Boolean,
    default: false
  },
  requiredDocuments: {
    passport: {
      type: Boolean,
      default: false
    },
    degree: {
      type: Boolean,
      default: false
    },
    transcript: {
      type: Boolean,
      default: false
    },
    experience_letter: {
      type: Boolean,
      default: false
    },
    language_certificate: {
      type: Boolean,
      default: false
    },
    medical_report: {
      type: Boolean,
      default: false
    },
    police_clearance: {
      type: Boolean,
      default: false
    }
  },
  generatedDocuments: {
    employmentContract: {
      type: String
    },
    visaInvitation: {
      type: String
    },
    workPermitLetter: {
      type: String
    },
    accommodationLetter: {
      type: String
    },
    flightBooking: {
      type: String
    },
    signedContract: {
      type: String
    }
  },
  notes: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  interviewScheduled: {
    date: {
      type: Date
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person']
    },
    location: {
      type: String
    },
    meetingLink: {
      type: String
    },
    notes: {
      type: String,
      maxlength: [500, 'Interview notes cannot exceed 500 characters']
    }
  },
  offerDetails: {
    salary: {
      type: String
    },
    startDate: {
      type: Date
    },
    benefits: [{
      type: String
    }],
    conditions: [{
      type: String
    }],
    expiryDate: {
      type: Date
    }
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });

// Virtual for application age in days
applicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.appliedAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for offer expiry status
applicationSchema.virtual('isOfferExpired').get(function() {
  if (!this.offerDetails?.expiryDate) return false;
  return new Date() > this.offerDetails.expiryDate;
});

export default mongoose.model<IApplication>('Application', applicationSchema);