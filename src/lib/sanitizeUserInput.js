import xss from 'xss'

const plainTextOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
}

/** Strip markup from user supplied text before it is stored or used in messages. */
export function sanitizeUserText(value) {
  if (typeof value !== 'string') return ''
  return xss(value, plainTextOptions).trim()
}
