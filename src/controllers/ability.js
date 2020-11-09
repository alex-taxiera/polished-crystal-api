import helica from 'helica'
import {
  fetchAbility,
  listAbilities,
} from '../services/ability.js'

import {
  routeLoader,
} from '../utils/route-loader.js'

const path = '/ability'

class Ability {

  async get (res, req) {
    const abilities = await listAbilities(
      req.parameters.version.toLowerCase(),
    )

    helica.json(
      res,
      abilities,
    )
  }

}

class AbilityName {

  async get (res, req) {
    const name = req.parameters.name.toLowerCase().replace(/%20/g, '')
    const version = req.parameters.version.toLowerCase()

    const abilityDescription = await fetchAbility(version, name)

    helica.json(
      res,
      {
        description: abilityDescription,
      },
    )
  }

}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Ability)
  app.addResource(`${basePath}${path}/:name`, AbilityName)
})
