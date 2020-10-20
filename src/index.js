// import { promises as fs } from 'fs'

import helica from 'helica'

import * as sprite from './controllers/sprite.js'

const app = new helica.Server({ sslApp: false, debug: true })

sprite.loadRoute(app, '/v1')

app.run()

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
