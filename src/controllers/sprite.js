import helica from 'helica'
import queryString from 'query-string'

import {
  fetchPokemonResources,
  processImage,
} from '../services/polished-crystal.js'
import {
  routeLoader,
} from '../utils/route-loader.js'

const path = 'sprite'

class Sprite {

  get (res) {
    helica.send(res, 'use sprite/:name')
  }

}

class SpriteName {

  async get (res, req) {
    const name = req.parameters[0]
    const query = queryString.parse(req.query)

    if (query.scale) {
      const num = parseInt(query.scale)
      if (isNaN(num)) {
        helica.send(res, 'resize factor is not an int', 400)
      }

      if (num < 1 || num > 8) {
        helica.send(res, 'resize factor is out of range [1 8]', 400)
      }
    }

    try {
      console.time('fetchPokemonResources')
      const {
        spriteBuffer,
        normalPAL,
        shinyPAL,
      } = await fetchPokemonResources(name, query.pal)
      console.timeEnd('fetchPokemonResources')

      const img = await processImage(
        spriteBuffer.toString('base64'),
        query.shiny === 'true' ? shinyPAL : normalPAL,
        query.scale,
      )

      helica.send(res, img)
    } catch (error) {
      console.log('error :>> ', error);
      switch (error.message) {
        case '404':
          helica.send(res, 'pokemon not found', 404)
          break
        default:
          helica.send(res, 'An error has occured', 500)
          break
      }
    }
  }

}

class SpriteCount {

  get (res) {
    helica.send(res, 'why did you try this?')
  }

}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Sprite)
  app.addResource(`${basePath}${path}/:name`, SpriteName)
  app.addResource(`${basePath}${path}/count`, SpriteCount)
})
