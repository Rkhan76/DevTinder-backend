require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger-output.json')



const connectDB = require('./config/db')

const app = express()

const mainRoutes = require('./routes/mainRoutes')

app.use(
  cors({
    origin: 'http://localhost:5173', // frontend origin
    credentials: true, // allow cookies
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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log('\x1b[36m%s\x1b[0m', `👉  http://localhost:${PORT}`)
})
