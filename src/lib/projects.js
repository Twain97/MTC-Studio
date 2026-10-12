import { Project } from '../models/Project.js'
import { sampleProjects } from '../data/sampleProjects.js'

export async function getPortfolioProjects({ limit, allowSamples = true, oldestFirst = false } = {}) {
  const direction = oldestFirst ? 1 : -1
  const query = Project.find().sort({ eventDate: direction, createdAt: direction })
  if (limit) query.limit(limit)
  const projects = await query
  if (projects.length || !allowSamples) return projects
  const fallbackProjects = oldestFirst
    ? [...sampleProjects].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    : sampleProjects
  return limit ? fallbackProjects.slice(0, limit) : fallbackProjects
}

export async function getPortfolioProject(id) {
  const sample = sampleProjects.find((project) => project._id === id)
  if (sample) return sample
  return Project.findById(id)
}
