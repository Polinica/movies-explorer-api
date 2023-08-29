require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const {
  errors,
} = require('celebrate')

// modules
const {
  routes,
} = require('./routes')
const {
  handleError,
} = require('./middlewares/handleError')

const {
  requestLogger, errorLogger,
} = require('./middlewares/logger')

const {
  PORT = 3000, DATABASE_URL = 'mongodb://127.0.0.1:27017/bitfilmsdb',
} = process.env

const app = express()

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log(`Connected to database on ${DATABASE_URL}`)
  })
  .catch((err) => {
    console.log('Error on database connection')
    console.error(err)
  })

// middlewares
app.use(requestLogger)
app.use(routes)

// error handlers
app.use(errorLogger)
app.use(errors())
app.use(handleError)

app.listen(PORT, () => {
  console.log(`App started on port ${PORT}...`)
})
