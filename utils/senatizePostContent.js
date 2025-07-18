const sanitizeHtml = require('sanitize-html')

const sanitizePostContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'a',
      'p',
      'ul',
      'ol',
      'li',
      'br',
      'pre',
      'code',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  })
}

module.exports = {
    sanitizePostContent
}