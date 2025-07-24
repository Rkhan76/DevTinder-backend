require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger-output.json')



const connectDB = require('./config/db')
const { initSocket } = require('./sockets/socket');

const app = express()

const mainRoutes = require('./routes/mainRoutes')

// Remove allowedOrigins and allow all origins for CORS
app.use(
  cors({
    origin: "*", // Allow all origins
    credentials: true, // Allow cookies and auth headers
  })
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/', mainRoutes)


connectDB()

app.get('/', (req, res) => {
    return res.status(200).json({
        message: "server is running"
    })
})

// Only start the server and socket.io if this file is run directly (not required by Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('\x1b[36m%s\x1b[0m', `👉  http://localhost:${PORT}`);
    });
    initSocket(server);
}

module.exports = app
