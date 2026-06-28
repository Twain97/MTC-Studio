import { Router } from 'express'
import { getPortfolioProject, getPortfolioProjects } from '../lib/projects.js'
import { env } from '../config/env.js'

const router = Router()
const siteUrl = env.siteUrl.replace(/\/+$/, '')
const brandDescription = 'MTC Studio creates refined wedding, portrait, event, and brand photography in Lagos and across Nigeria.'
const defaultImage = `${siteUrl}/images/mtc-studio.png`
const socialUrls = [env.business.instagramUrl, env.business.tiktokUrl, env.business.facebookUrl].filter(Boolean)

function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${siteUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function pageSeo({ title, description = brandDescription, path = '/', image = defaultImage, type = 'website', schema }) {
  return {
    title,
    description,
    canonical: absoluteUrl(path),
    image: absoluteUrl(image),
    type,
    schema
  }
}

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${siteUrl}/#organization`,
  name: env.business.name,
  url: siteUrl,
  image: defaultImage,
  description: brandDescription,
  email: env.business.email,
  telephone: env.business.phone,
  address: env.business.address,
  areaServed: env.business.serviceArea,
  sameAs: socialUrls,
  priceRange: 'NGN'
}

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
    const projects = await getPortfolioProjects({ limit: 4 })
    res.render('pages/home', {
      title: 'MTC Studio',
      page: 'home',
      projects,
      services,
      pricing,
      seo: pageSeo({
        title: 'MTC Studio | Wedding and Portrait Photography in Lagos',
        path: '/',
        schema: organizationSchema
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/about', (_req, res) => {
  res.render('pages/about', {
    title: 'About MTC Studio',
    page: 'about',
    values,
    seo: pageSeo({
      title: 'About MTC Studio | Lagos Photographer',
      description: 'Meet MTC Studio, a Lagos photography studio documenting weddings, portraits, birthdays, convocations, and brand stories.',
      path: '/about',
      schema: organizationSchema
    })
  })
})

router.get('/portfolio', async (_req, res, next) => {
  try {
    const projects = await getPortfolioProjects({ limit: 3 })
    res.render('pages/portfolio', {
      title: 'Portfolio',
      page: 'portfolio',
      projects,
      seo: pageSeo({
        title: 'Photography Portfolio | MTC Studio',
        description: 'View selected wedding, portrait, celebration, and commercial photography projects by MTC Studio.',
        path: '/portfolio'
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/portfolio/:id', async (req, res, next) => {
  try {
    const project = await getPortfolioProject(req.params.id)
    if (!project) {
      return res.status(404).render('errors/not-found', {
        title: 'Event not found',
        page: '',
        seo: { robots: 'noindex, follow' }
      })
    }
    const eventPath = `/portfolio/${project._id}`
    res.render('pages/event', {
      title: project.eventName,
      page: 'portfolio',
      project,
      seo: pageSeo({
        title: `${project.eventName} | MTC Studio Portfolio`,
        description: project.description || `${project.eventName} photographed by MTC Studio in ${project.location}.`,
        path: eventPath,
        image: project.thumbnail,
        type: 'article',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: project.eventName,
          description: project.description || `${project.eventName} by MTC Studio`,
          url: absoluteUrl(eventPath),
          image: [project.thumbnail, ...(project.images || [])].map(absoluteUrl),
          locationCreated: project.location,
          creator: { '@id': `${siteUrl}/#organization` }
        }
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/contact', (_req, res) => {
  res.render('pages/contact', {
    title: 'Book MTC Studio',
    page: 'contact',
    seo: pageSeo({
      title: 'Book MTC Studio | Photography Sessions in Lagos',
      description: 'Contact MTC Studio to book wedding, portrait, event, family, corporate, or brand photography in Lagos and across Nigeria.',
      path: '/contact',
      schema: {
        ...organizationSchema,
        '@type': 'PhotographyBusiness'
      }
    })
  })
})

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    `Sitemap: ${siteUrl}/sitemap.xml`
  ].join('\n'))
})

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const projects = await getPortfolioProjects()
    const urls = [
      { loc: '/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
      { loc: '/portfolio', priority: '0.9', changefreq: 'weekly' },
      { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
      ...projects.map((project) => ({
        loc: `/portfolio/${project._id}`,
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: project.updatedAt || project.createdAt || project.eventDate
      }))
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => {
      const lastmod = url.lastmod ? `\n    <lastmod>${escapeXml(new Date(url.lastmod).toISOString().slice(0, 10))}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(absoluteUrl(url.loc))}</loc>${lastmod}\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
    }).join('\n')}\n</urlset>`

    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
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
