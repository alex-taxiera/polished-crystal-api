import helica from 'helica'
import config from 'config'

import * as polishedCrystal from './controllers/polished-crystal.js'
import * as sprite from './controllers/sprite.js'
import * as stat from './controllers/stats.js'

const debug = process.env.NODE_ENV !== 'production'
const app = new helica.Server({ sslApp: false, debug })
const versionedPath = '/:version'

function originHeaders (res) {
  res.writeHeader(
    'Access-Control-Allow-Origin',
    debug ? '*' : config.get('webDomain'),
  )
  if (!debug) {
    res.writeHeader('Vary', 'Origin')
  }
}

app.server.options('*', (res) => {
  originHeaders(res)
  res.writeHeader('Connection', 'keep-alive')
  res.writeHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, OPTIONS, DELETE',
  )
  res.writeHeader('Access-Control-Max-Age', 86400)
  res.writeHeader('Content-Length', '0')
  res.writeStatus('204')
  res.end()
})

app.addMiddleware((res) => originHeaders(res))

polishedCrystal.loadRoute(app)
sprite.loadRoute(app, versionedPath)
stat.loadRoute(app, versionedPath)

app.run('0.0.0.0', config.has('PORT') ? config.get('PORT') : 3000)
