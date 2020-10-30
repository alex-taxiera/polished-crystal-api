import helica from 'helica'
import queryString from 'query-string'

import {
  fetchPAL,
  fetchSprite,
  processImage,
} from '../services/sprite.js'
import {
  listPokemon,
} from '../services/stats.js'
import {
  PC_BAD_SPRITES,
  PC_SPRITE_PATH,
} from '../utils/constants.js'
import {
  routeLoader,
} from '../utils/route-loader.js'

const path = '/pokemon/sprite'

class Sprite {

  async get (res, req) {
    const sprites = await listPokemon(req.parameters.version, PC_SPRITE_PATH)

    helica.json(
      res,
      sprites
        .filter((file) =>
          file.type === 'tree' &&
          PC_BAD_SPRITES.every((sprite) => file.name !== sprite),
        )
        .map((file) => file.name),
    )
  }

}

class SpriteName {

  async get (res, req) {
    const {
      name,
      version,
    } = req.parameters

    if (PC_BAD_SPRITES.includes(name)) {
      helica.send(res, 'please use a pokemon name with a sprite', 400)
    }
    const backupPal = PC_BAD_SPRITES.find((sprite) => name.startsWith(sprite))
    const query = queryString.parse(req.query)

    if (query.scale) {
      const num = parseInt(query.scale)
      if (isNaN(num)) {
        helica.send(res, 'resize factor is not an int', 400)
      }

      if (num < 1 || num > 8) {
        helica.send(res, 'resize factor is out of range [1,8]', 400)
      }
    }

    try {
      console.time('fetch')
      const [
        spriteBuffer,
        pal,
      ] = await Promise.all([
        fetchSprite(name, version),
        fetchPAL(
          query.pal ?? backupPal ?? name,
          version,
          query.shiny === 'true',
        ),
      ])
      console.timeEnd('fetch')

      console.time('img')
      const img = await processImage(
        spriteBuffer.toString('base64'),
        pal,
        query.scale,
      )
      console.timeEnd('img')

      helica.send(res, img)
    } catch (error) {
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

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Sprite)
  app.addResource(`${basePath}${path}/:name`, SpriteName)
})
