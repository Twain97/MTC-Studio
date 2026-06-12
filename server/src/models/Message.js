import mongoose from 'mongoose'

const replySchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    contractPath: String,
    sentAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    emailStatus: { type: String, enum: ['sent', 'failed', 'not_configured'], default: 'not_configured' },
    emailError: String,
    replies: [replySchema]
  },
  { timestamps: true }
)

messageSchema.index({ isRead: 1, createdAt: -1 })

export const Message = mongoose.model('Message', messageSchema)

