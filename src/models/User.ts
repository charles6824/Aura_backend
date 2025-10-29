import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'admin' | 'company';
  profileCompleted: boolean;
  assessmentCompleted: boolean;
  googleId?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  currentLocation?: string;
  preferredCountries?: string[];
  skills?: string[];
  experience?: number;
  education?: {
    degree: string;
    institution: string;
    year: number;
  }[];
  languages?: {
    language: string;
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
  }[];
  documents?: {
    type: 'passport' | 'resume' | 'certificate' | 'other';
    url: string;
    name: string;
    uploadedAt: Date;
  }[];
  savedJobs?: mongoose.Types.ObjectId[];
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'company'],
    default: 'user'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  assessmentCompleted: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  nationality: {
    type: String,
    trim: true
  },
  currentLocation: {
    type: String,
    trim: true
  },
  preferredCountries: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: 0,
    max: 50
  },
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear() + 10
    }
  }],
  languages: [{
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
  documents: [{
    type: {
      type: String,
      enum: ['passport', 'resume', 'certificate', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (email index is created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for profile completion percentage
userSchema.virtual('profileCompletionPercentage').get(function() {
  const requiredFields = ['name', 'email', 'phone', 'dateOfBirth', 'nationality', 'currentLocation'];
  const optionalFields = ['skills', 'experience', 'education', 'languages'];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (this[field as keyof IUser]) completed++;
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const value = this[field as keyof IUser];
    if (Array.isArray(value) ? value.length > 0 : value) completed++;
  });
  
  return Math.round((completed / total) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Update profileCompleted based on completion percentage
userSchema.pre('save', function(next) {
  this.profileCompleted = (this as any).profileCompletionPercentage >= 80;
  next();
});

export default mongoose.model<IUser>('User', userSchema);