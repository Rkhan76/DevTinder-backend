const validator = require('validator')

 const sanitizeFullname = (fullname) => {
  const trimmed = fullname.trim()

  // Optional: Reject names with numbers or symbols
  const isValid = validator.isAlpha(trimmed.replace(/[\s\-']/g, ''), 'en-US')

  if (!isValid) {
    throw new Error('Full name contains invalid characters.')
  }

  // Escape any HTML tags or injection characters (e.g., <script>)
  return validator.escape(trimmed)
}

module.exports = {
  sanitizeFullname,
}