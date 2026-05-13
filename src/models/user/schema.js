import { Schema } from 'mongoose';

export const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  mobileNumber: {
    type: String,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  restoredAt: {
    type: Date,
  },
  key: {
    type: String,
  },
  keyExpiry: {
    type: Date,
  },
  invitationCreatedAt: {
    type: Date,
  },
  invitationSentAt: {
    type: Date,
  },
  invitationAcceptedAt: {
    type: Date,
  },
  isVerified: {
    email: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false },
  },
  emailVerificationLinkSentAt: {
    type: Date,
  },
  emailVerificationToken: {
    type: String,
  },
  passwordResetLinkSentAt: {
    type: Date,
  },
  passwordVerificationToken: {
    type: String,
  },
  csrfToken: {
    type: String,
  },
});

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
