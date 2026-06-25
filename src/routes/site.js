import { Router } from 'express'
import { getPortfolioProject, getPortfolioProjects } from '../lib/projects.js'

const router = Router()

const services = [
  { title: 'Weddings', text: 'Honest, elegant coverage from quiet preparations to the final dance.' },
  { title: 'Portraits', text: 'Relaxed personal and family sessions with thoughtful direction.' },
  { title: 'Drone Coverage', text: 'Aerial shots of events and locations from a unique perspective.' }
]

const pricing = [
  { name: 'Celebratory Portraits', price: 'N40,000', detail: 'For graduations, birthdays, baby bumps, and anniversaries.', features: ['6 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Corporate Photographs', price: 'N40,000', detail: 'For corporate portraits and branding.', features: ['6 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Couple Portrait', price: 'N60,000', detail: 'For couples pre-wedding shoots.', features: ['6 edited photographs per outfit', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Family Portraits', price: 'N80,000', detail: 'For birthdays, naming ceremonies, and burials.', features: ['10 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Event Coverage', price: 'N300,000', detail: 'For a single event day. Additional days attract an extra fee of N170,000.', features: ['Birthdays', 'Engagements', 'Weddings', 'Retirement ceremonies', 'Burials', 'Corporate events', '7-14 days delivery'], featured: true },
  { name: 'Campaign', price: 'Custom', detail: 'For brands, editorial teams, and commercial work.', features: ['Creative consultation', 'Production planning', 'Commercial usage options'], featured: true }
]

const values = [
  { title: 'Observe first', text: 'We watch for real connection before giving direction, keeping the story natural.' },
  { title: 'Shape the light', text: 'Every frame is composed with a clean editorial eye and careful use of light.' },
  { title: 'Make it personal', text: 'The experience is calm, collaborative, and built around what matters to you.' }
]

router.get('/', async (_req, res, next) => {
  try {
    const projects = await getPortfolioProjects({ limit: 3 })
    res.render('pages/home', { title: 'MTC Studio', page: 'home', projects, services, pricing })
  } catch (error) {
    next(error)
  }
})

router.get('/about', (_req, res) => {
  res.render('pages/about', { title: 'About MTC Studio', page: 'about', values })
})

router.get('/portfolio', async (_req, res, next) => {
  try {
    const projects = await getPortfolioProjects({ limit: 3 })
    res.render('pages/portfolio', { title: 'Portfolio', page: 'portfolio', projects })
  } catch (error) {
    next(error)
  }
})

router.get('/portfolio/:id', async (req, res, next) => {
  try {
    const project = await getPortfolioProject(req.params.id)
    if (!project) return res.status(404).render('errors/not-found', { title: 'Event not found', page: '' })
    res.render('pages/event', { title: project.eventName, page: 'portfolio', project })
  } catch (error) {
    next(error)
  }
})

router.get('/contact', (_req, res) => {
  res.render('pages/contact', { title: 'Book MTC Studio', page: 'contact' })
})

router.get('/admin', (_req, res) => {
  res.redirect('/admin/dashboard')
})

router.get('/admin/login', (_req, res) => {
  res.render('admin/login', { title: 'Admin Login', page: 'admin-login' })
})

router.get('/admin/dashboard', (_req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard', page: 'admin-dashboard' })
})

router.get('/admin/messages', (_req, res) => {
  res.render('admin/messages', { title: 'Messages', page: 'admin-messages' })
})

router.get('/admin/messages/:id', (req, res) => {
  res.render('admin/message', {
    title: 'Message',
    page: 'admin-message',
    messageId: req.params.id
  })
})

router.get('/admin/upload', (_req, res) => {
  res.render('admin/upload', { title: 'Upload Project', page: 'admin-upload' })
})

export default router
