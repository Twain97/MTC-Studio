import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true, maxlength: 120 },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1500 },
    thumbnail: { type: String, required: true },
    thumbnailVariants: {
      small: { type: String },
      smallWidth: { type: Number },
      large: { type: String },
      largeWidth: { type: Number }
    },
    images: {
      type: [String],
      validate: [(value) => value.length <= 10, 'A project can contain at most ten gallery images.']
    },
    imageVariants: [{ small: String, smallWidth: Number, large: String, largeWidth: Number }],
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
)

projectSchema.index({ eventDate: -1 })

export const Project = mongoose.model('Project', projectSchema)
