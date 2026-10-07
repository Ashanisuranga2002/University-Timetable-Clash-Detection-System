import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  studentId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['coordinator', 'student', 'advisor', 'monitor'],
    default: 'student',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});
userSchema.index({
  studentId: 1
}, {
  unique: true
});
userSchema.index({
  email: 1
}, {
  unique: true
});
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
export const User = model('User', userSchema);
