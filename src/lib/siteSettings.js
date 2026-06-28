import { SiteSettings } from '../models/SiteSettings.js'

const SETTINGS_KEY = 'global'

export async function getSiteSettings() {
  return SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY, constructionOverlayEnabled: false } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
}

export async function setConstructionOverlayEnabled(enabled) {
  return SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { constructionOverlayEnabled: Boolean(enabled) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
}
