import bcrypt from 'bcrypt';

import { Schema } from 'mongoose';

const userSchema = new Schema({
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

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default function (mongooseConnection) {
  return mongooseConnection.model('User', userSchema);
}
