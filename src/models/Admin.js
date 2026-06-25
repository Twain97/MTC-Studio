import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 10, select: false },
    lastLoginAt: Date
  },
  { timestamps: true }
)

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

adminSchema.methods.matchesPassword = function matchesPassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

export const Admin = mongoose.model('Admin', adminSchema)

