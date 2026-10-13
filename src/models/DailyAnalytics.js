import mongoose from 'mongoose'

const dailyAnalyticsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  visitorHashes: { type: [String], default: [] },
  imageConversions: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

export const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema)
