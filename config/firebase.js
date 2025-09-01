const admin = require('firebase-admin')

// Prevent re-initializing during hot reloads / multiple imports
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../config/serviceAccountKey.json')
    ), 
  })
}

module.exports = admin
