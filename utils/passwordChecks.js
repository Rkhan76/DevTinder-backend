const bcrypt = require('bcrypt')


const matchPassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword)
}

module.exports = matchPassword