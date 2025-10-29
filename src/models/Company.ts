import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  registrationNumber: string;
  industry: string;
  companySize: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  foundedYear: number;
  headquarters: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  description: string;
  website?: string;
  logo?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    hrEmail?: string;
    hrPhone?: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: {
    type: 'business_license' | 'tax_certificate' | 'incorporation_certificate';
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  }[];
  benefits: string[];
  workCulture: string[];
  certifications: string[];
  isActive: boolean;
  profileCompletionPercentage: number;
  documentsGenerated: {
    employmentContract: boolean;
    visaInvitation: boolean;
    workPermitLetter: boolean;
    accommodationLetter: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    trim: true,
    unique: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    required: true
  },
  foundedYear: {
    type: Number,
    required: true,
    min: 1800,
    max: new Date().getFullYear()
  },
  headquarters: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    }
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  logo: {
    type: String,
    trim: true
  },
  socialMedia: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    hrEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    hrPhone: {
      type: String,
      trim: true
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'incorporation_certificate'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  workCulture: [{
    type: String,
    trim: true
  }],
  certifications: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  documentsGenerated: {
    employmentContract: {
      type: Boolean,
      default: false
    },
    visaInvitation: {
      type: Boolean,
      default: false
    },
    workPermitLetter: {
      type: Boolean,
      default: false
    },
    accommodationLetter: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
companySchema.index({ userId: 1 });
companySchema.index({ verificationStatus: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ isActive: 1 });

// Pre-save middleware to calculate profile completion
companySchema.pre('save', function(next) {
  const requiredFields = [
    'companyName', 'registrationNumber', 'industry', 'companySize', 
    'foundedYear', 'headquarters', 'description', 'contactInfo'
  ];
  const optionalFields = ['website', 'logo', 'socialMedia', 'benefits', 'workCulture'];
  
  let completed = 0;
  const total = requiredFields.length + optionalFields.length;
  
  requiredFields.forEach(field => {
    if (this[field as keyof ICompany]) completed++;
  });
  
  optionalFields.forEach(field => {
    const value = this[field as keyof ICompany];
    if (Array.isArray(value) ? value.length > 0 : value) completed++;
  });
  
  this.profileCompletionPercentage = Math.round((completed / total) * 100);
  next();
});

export default mongoose.model<ICompany>('Company', companySchema);