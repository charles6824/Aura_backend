import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  type: 'passport' | 'degree' | 'transcript' | 'experience_letter' | 'language_certificate' | 'medical_report' | 'police_clearance' | 'other';
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'expired';
  verificationNotes?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  expiryDate?: Date;
  metadata: {
    extractedText?: string;
    ocrConfidence?: number;
    documentNumber?: string;
    issueDate?: Date;
    issuingAuthority?: string;
  };
  generatedDocuments?: {
    type: 'visa_application' | 'work_permit' | 'invitation_letter' | 'employment_contract';
    fileName: string;
    fileUrl: string;
    generatedAt: Date;
  }[];
}

const documentSchema = new Schema<IDocument>({
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
  type: {
    type: String,
    enum: ['passport', 'degree', 'transcript', 'experience_letter', 'language_certificate', 'medical_report', 'police_clearance', 'other'],
    required: true
  },
  originalName: {
    type: String,
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
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    maxlength: 1000
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  metadata: {
    extractedText: String,
    ocrConfidence: Number,
    documentNumber: String,
    issueDate: Date,
    issuingAuthority: String
  },
  generatedDocuments: [{
    type: {
      type: String,
      enum: ['visa_application', 'work_permit', 'invitation_letter', 'employment_contract'],
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
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

documentSchema.index({ userId: 1, applicationId: 1 });
documentSchema.index({ type: 1, status: 1 });
documentSchema.index({ verifiedBy: 1 });

export default mongoose.model<IDocument>('Document', documentSchema);