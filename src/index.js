import helica from 'helica'
import config from 'config'

import * as polishedCrystal from './controllers/polished-crystal.js'
import * as sprite from './controllers/sprite.js'
import * as stat from './controllers/stats.js'
import * as ability from './controllers/ability.js'
import * as move from './controllers/move.js'
import * as option from './controllers/option.js'

import {
  originHeaders,
} from './middlewares/cors.js'

const debug = process.env.NODE_ENV !== 'production'
const app = new helica.Server({ sslApp: false, debug })
const versionedPath = '/:version'

app.addMiddleware(originHeaders)

option.loadRoute(app)
polishedCrystal.loadRoute(app)
sprite.loadRoute(app, versionedPath)
stat.loadRoute(app, versionedPath)
ability.loadRoute(app, versionedPath)
move.loadRoute(app, versionedPath)

app.run('0.0.0.0', config.has('PORT') ? config.get('PORT') : 3000)
