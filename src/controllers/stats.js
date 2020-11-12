import helica from 'helica'

import {
  fetchMoveNames,
  fetchTMHMs,
  MOVE_SUFFIX,
} from '../services/move.js'

import {
  fetchBaseStats,
  fetchEvosMoves,
} from '../services/stats.js'
import {
  fetchPokemonNames,
  listPokemon,
  processPokemonNames,
} from '../services/pokemon.js'
import { PC_BASE_STATS_PATH } from '../utils/constants.js'
import {
  routeLoader,
} from '../utils/route-loader.js'
import { moveSummaryView } from './move.js'
import { titleCase } from '../utils/title-case.js'

const path = '/pokemon/stat'

const validForms = [
  'plain',
  'alolan',
  'galarian',
  'armored',
  'm',
  'f',
]

class Stat {

  async get (res, req) {
    const version = req.parameters.version.toLowerCase()
    const [
      pokemon,
      names,
    ] = await Promise.all([
      listPokemon(version, PC_BASE_STATS_PATH),
      fetchPokemonNames(version),
    ])

    helica.json(
      res,
      pokemon
        .map((file) => ({
          id: file.name.slice(0, -4).toUpperCase(),
          displayName: pokemonDisplayName(file.name.slice(0, -4), names),
        })),
    )
  }

}

class StatId {

  async get (res, req) {
    const id = req.parameters.id.toLowerCase()
    const version = req.parameters.version.toLowerCase()

    const [
      stats,
      statsNames,
      evosMoves,
      moveNames,
      tmsMap,
    ] = await Promise.all([
      fetchBaseStats(id, version),
      fetchPokemonNames(version),
      fetchEvosMoves(evosMovesName(id), version),
      fetchMoveNames(version),
      fetchTMHMs(version),
    ])

    helica.json(
      res,
      faithfulBaseView(id, stats, statsNames, evosMoves, moveNames, tmsMap),
    )
  }

}

function pokemonDisplayName (id, displayNames) {
  const parts = id.split('_')
  let form = parts.length > 1 ? parts.pop() : null
  let cleanName = parts.join('')

  if (form && !validForms.includes(form)) {
    cleanName += `_${form}`
    form = null
  }

  if (form === 'f' || form === 'm') {
    cleanName += form === 'f'
      ? '♀'
      : '♂'

    form = null
  }

  let displayName = processPokemonNames(displayNames, cleanName)

  if (form && form !== 'plain') {
    displayName = `${titleCase(form)} ${displayName}`
  }

  return displayName
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

export function faithfulBaseView (
  id,
  stats,
  statsNames,
  evosMoves,
  moveNames,
  tmsMap,
) {
  const view = {
    id,
    displayName: pokemonDisplayName(id, statsNames),
    ...pokemonView(
      stats.faithful ?? stats,
      statsNames,
      evosMoves.faithful ?? evosMoves,
      moveNames,
      tmsMap,
    ),
  }

  if (stats.unfaithful || evosMoves.unfaithful) {
    view.unfaithful = pokemonView(
      stats.unfaithful,
      statsNames,
      evosMoves.unfaithful,
      moveNames,
      tmsMap,
    )
  }

  return view
}

export function pokemonView (
  stats = {},
  statsNames,
  evosMoves = {},
  moveNames,
  tmsMap,
) {
  return {
    types: stats.types,
    abilities: stats.abilities,
    evolutions: evosMoves.evolutions
      ?.map((evo) => evolutionView(evo, statsNames)),
    heldItems: stats.heldItems,
    gender: stats.gender,
    baseExp: stats.baseExp && parseInt(stats.baseExp),
    catchRate: stats.catchRate && parseInt(stats.catchRate),
    eggGroups: stats.eggGroups,
    hatchCycles: stats.hatchCycles && parseInt(stats.hatchCycles),
    growthRate: stats.growthRate,
    baseStats: stats.baseStats,
    evYield: stats.evYield,
    movesByLevel: evosMoves.moves
      ?.map((move) => levelMoveView(move, moveNames)),
    movesByTMHM: stats.tms
      ?.map((id) => tmhmMoveView({ id }, moveNames, tmsMap)),
  }
}

export function evolutionView (evo, statsNames) {
  return {
    ...evo,
    to: {
      id: evo.to.id,
      displayName: pokemonDisplayName(evo.to.id, statsNames),
    },
  }
}

export function levelMoveView (move, moveNames) {
  return {
    ...move,
    ...moveSummaryView(move, moveNames),
    level: parseInt(move.level),
  }
}

export function tmhmMoveView (move, moveNames, tmsMap) {
  return {
    ...move,
    ...moveSummaryView(move, moveNames),
    tmhm: tmsMap[move.id] ?? tmsMap[`${move.id}${MOVE_SUFFIX}`],
  }
}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Stat)
  app.addResource(`${basePath}${path}/:id`, StatId)
})
