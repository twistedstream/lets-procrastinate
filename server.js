require('dotenv').config()
require('express-async-errors')
const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
const logger = require('morgan')
const http = require('http')
const https = require('https')
const { engine } = require('express-handlebars')
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser')

const package = require('./package.json')
const { auth, redirectToLogin } = require('./utils/auth')
const routes = require('./routes')

const { COOKIE_SECRET } = process.env

const app = express()

// session and authentication

app.use(
  cookieSession({
    secret: COOKIE_SECRET,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
)

app.use(auth())

// other global middlewares

app.use(cookieParser(COOKIE_SECRET))

app.use(logger('dev'))

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'handlebars')
app.engine(
  'handlebars',
  engine({
    defaultLayout: 'main'
  })
)

// make user data available in all views
app.use((req, res, next) => {
  res.locals.user = req.user

  next()
})

// routes
app.use(routes)

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  const err = new Error('Not Found')
  err.status = 404

  next(err)
})

// error handler
app.use(function (err, req, res, _next) {
  const { message, status = 500 } = err
  const description = status >= 500 ? 'Something unexpected happened' : message
  const details = process.env.NODE_ENV !== 'production' ? err.stack : ''

  if (status === 401) {
    console.log('Redirecting UNAUTHORIZED to login page')

    return redirectToLogin(req, res)
  }

  res.status(status)

  if (status === 404) {
    return res.render('not_found')
  }
  if (status >= 500) {
    console.error('ERROR:', err)
  }

  res.render('error', {
    status,
    description,
    details
  })
})

// start the server
const server =
  process.env.NODE_ENV === 'production'
    ? http.createServer(app)
    : https.createServer(
        {
          key: fs.readFileSync(path.resolve('./cert/dev.key')),
          cert: fs.readFileSync(path.resolve('./cert/dev.crt'))
        },
        app
      )

const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(
    `${package.description} (v${package.version}), listening on port ${port}`
  )
})
