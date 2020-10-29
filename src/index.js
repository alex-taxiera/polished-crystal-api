// import { promises as fs } from 'fs'

import helica from 'helica'

import * as polishedCrystal from './controllers/polished-crystal.js'
import * as sprite from './controllers/sprite.js'
import * as stat from './controllers/stats.js'

const debug = process.env.NODE_ENV !== 'production'
const app = new helica.Server({ sslApp: false, debug })
const versionedPath = '/:version'
polishedCrystal.loadRoute(app)
sprite.loadRoute(app, versionedPath)
stat.loadRoute(app, versionedPath)

app.run('0.0.0.0', 3000)

// main()
// async function main () {
//   const shiny = false
//   const {
//     spriteBuffer,
//     normalPAL,
//     shinyPAL,
//   } = await fetchPokemonResources('totodile')

//   const img = await processImage(
//     spriteBuffer.toString('base64'),
//     shiny ? shinyPAL : normalPAL,
//   )
//   console.log('img :>> ', img)
//   await fs.writeFile('totodile.png', img)
// }
