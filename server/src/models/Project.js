import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true, maxlength: 120 },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1500 },
    thumbnail: { type: String, required: true },
    images: {
      type: [String],
      validate: [(value) => value.length <= 5, 'A project can contain at most five gallery images.']
    },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
)

projectSchema.index({ eventDate: -1 })

export const Project = mongoose.model('Project', projectSchema)

