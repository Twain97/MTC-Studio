import { Project } from '../models/Project.js'
import { sampleProjects } from '../data/sampleProjects.js'

export async function getPortfolioProjects({ limit, allowSamples = true } = {}) {
  const query = Project.find().sort({ eventDate: -1, createdAt: -1 })
  if (limit) query.limit(limit)
  const projects = await query
  if (projects.length || !allowSamples) return projects
  return limit ? sampleProjects.slice(0, limit) : sampleProjects
}

export async function getPortfolioProject(id) {
  const sample = sampleProjects.find((project) => project._id === id)
  if (sample) return sample
  return Project.findById(id)
}
