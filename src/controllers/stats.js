import helica from 'helica'
import {
  fetchMoveNames,
  findMoveName,
} from '../services/move.js'

import {
  fetchBaseStats,
  fetchEvosMoves,
  listPokemon,
} from '../services/stats.js'
import { PC_BASE_STATS_PATH } from '../utils/constants.js'
import {
  routeLoader,
} from '../utils/route-loader.js'
import { moveSummaryView } from './move.js'

const path = '/pokemon/stat'

class Stat {

  async get (res, req) {
    const pokemon = await listPokemon(
      req.parameters.version.toLowerCase(),
      PC_BASE_STATS_PATH,
    )

    helica.json(
      res,
      pokemon
        .map((file) => file.name.slice(0, -4)),
    )
  }

}

class StatName {

  async get (res, req) {
    const name = req.parameters.name.toLowerCase()
    const version = req.parameters.version.toLowerCase()

    const [
      stats,
      evosMoves,
      moveNames,
    ] = await Promise.all([
      fetchBaseStats(name, version),
      fetchEvosMoves(evosMovesName(name), version),
      fetchMoveNames(version),
    ])

    helica.json(
      res,
      statView(stats, evosMoves, moveNames),
    )
  }

}

function evosMovesName (name) {
  if (name.startsWith('mewtwo')) {
    return 'mewtwo'
  }
  const [ trueName, form ] = name.split('_')

  switch (form) {
    case 'plain':
    case 'alolan':
    case 'galarian':
      return `${trueName}${form}`
    default:
      return name.replace(/_/g, '')
  }
}

export function statView (stats, evosMoves, moveNames) {
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
    movesByLevel: (evosMoves.faithful?.moves ?? evosMoves.moves)
      .map((move) => ({
        ...moveSummaryView(move, moveNames),
        level: move.level,
      })),
    movesByTMHM: base.tms.map((id) => moveSummaryView({ id }, moveNames)),
    unfaithful: stats.unfaithful || evosMoves.unfaithful
      ? {
        ...stats.unfaithful,
        movesByLevel: evosMoves.unfaithful?.moves,
        evolutions: evosMoves.unfaithful?.evolutions,
      }
      : undefined,
  }
}

function movesView (moves, names) {
  return moves.map((move) => {
    const isLevelMove = move.move != null
    const id = isLevelMove ? move.move : move
    const name = names.find(findMoveName(id))

    return isLevelMove ? {
      ...move,
      move: {
        id: move.move,
        name,
      },
    } : {
      id: move,
      name,
    }
  })
}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Stat)
  app.addResource(`${basePath}${path}/:name`, StatName)
})
