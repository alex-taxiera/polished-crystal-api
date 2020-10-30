import helica from 'helica'

import {
  fetchBaseStats,
  fetchEvosMoves,
  listPokemon,
} from '../services/stats.js'
import { PC_BASE_STATS_PATH } from '../utils/constants.js'
import {
  routeLoader,
} from '../utils/route-loader.js'

const path = '/pokemon/stat'

class Stat {

  async get (res, req) {
    const pokemon = await listPokemon(req.parameters.version, PC_BASE_STATS_PATH)

    helica.json(
      res,
      pokemon
        .map((file) => file.name.slice(0, -4)),
    )
  }

}

class StatName {

  async get (res, req) {
    const {
      name,
      version,
    } = req.parameters

    const [
      stats,
      evosMoves,
    ] = await Promise.all([
      fetchBaseStats(name, version),
      fetchEvosMoves(name, version),
    ])

    helica.json(
      res,
      statView(stats, evosMoves),
    )
  }

}

export function statView (stats, evosMoves) {
  const base = stats.faithful ?? stats

  return {
    types: base.types,
    abilities: base.abilities,
    evolutions: evosMoves.faithful?.evolutions ?? evosMoves.evolutions,
    heldItems: base.heldItems,
    gender: base.gender,
    baseExp: base.baseExp,
    catchRate: base.catchRate,
    eggGroups: base.eggGroups,
    hatchCycles: base.hatchCycles,
    growthRate: base.growthRate,
    baseStats: base.baseStats,
    evYield: base.evYield,
    movesByLevel: evosMoves.faithful?.moves ?? evosMoves.moves,
    movesByTMHM: base.tms,
    unfaithful: stats.unfaithful || evosMoves.unfaithful
      ? {
        ...stats.unfaithful,
        movesByLevel: evosMoves.unfaithful?.moves,
        evolutions: evosMoves.unfaithful?.evolutions,
      }
      : undefined,
  }
}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Stat)
  app.addResource(`${basePath}${path}/:name`, StatName)
})
