import { createHash } from 'node:crypto'
import { DailyAnalytics } from '../models/DailyAnalytics.js'

const businessTimeZone = 'Africa/Lagos'

export function getAnalyticsDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: businessTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const part = (type) => parts.find((entry) => entry.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function getRecentAnalyticsDateKeys(days = 7) {
  const today = getAnalyticsDateKey()
  const date = new Date(`${today}T00:00:00.000Z`)
  return Array.from({ length: days }, (_, index) => {
    const dateIndex = index - (days - 1)
    const current = new Date(date)
    current.setUTCDate(current.getUTCDate() + dateIndex)
    return current.toISOString().slice(0, 10)
  })
}

export async function recordDailyVisitor(visitorId) {
  const date = getAnalyticsDateKey()
  const visitorHash = createHash('sha256').update(visitorId).digest('hex')
  await DailyAnalytics.updateOne(
    { date },
    { $setOnInsert: { date }, $addToSet: { visitorHashes: visitorHash } },
    { upsert: true }
  )
}

export async function recordImageConversion() {
  const date = getAnalyticsDateKey()
  await DailyAnalytics.updateOne(
    { date },
    { $setOnInsert: { date }, $inc: { imageConversions: 1 } },
    { upsert: true }
  )
}

export async function getRecentDailyAnalytics(days = 7) {
  const dates = getRecentAnalyticsDateKeys(days)
  const records = await DailyAnalytics.find({ date: { $in: dates } }).select('date visitorHashes imageConversions').lean()
  const byDate = new Map(records.map((record) => [record.date, record]))
  return dates.map((date) => {
    const record = byDate.get(date)
    return {
      date,
      visitorCount: record?.visitorHashes?.length || 0,
      imageConversionCount: record?.imageConversions || 0
    }
  })
}
