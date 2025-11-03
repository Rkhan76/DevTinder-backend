function extractHashtags(text) {
  if (typeof text !== "string") return [];

  // Match hashtags (words starting with #, followed by letters, numbers, or underscores)
  const matches = text.match(/#[\w]+/g);

  // Return unique hashtags (if you want only unique ones)
  return matches ? [...new Set(matches)] : [];
}


module.exports = {
    extractHashtags
}
