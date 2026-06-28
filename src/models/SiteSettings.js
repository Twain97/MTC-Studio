import mongoose from 'mongoose'

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    constructionOverlayEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema)
