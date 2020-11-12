import helica from 'helica'
import queryString from 'query-string'
import {
  fetchMoveData,
  fetchMoveDescriptions,
  fetchMoveNames,
  findMoveName,
  getMoveDescription,
} from '../services/move.js'

import {
  routeLoader,
} from '../utils/route-loader.js'
import {
  quiet,
} from '../utils/transform-screaming-text.js'

const path = '/move'

class Move {

  async get (res, req) {
    const version = req.parameters.version.toLowerCase()
    const [
      moveData,
      moveNames,
    ] = await Promise.all([
      fetchMoveData(version),
      fetchMoveNames(version),
    ])

    helica.json(
      res,
      moveData
        .filter((move, i) => moveData.findIndex((m) => m.id === move.id) === i)
        .map((move) => moveSummaryView(move, moveNames)),
    )
  }

}

class MoveName {

  async get (res, req) {
    const id = req.parameters.id.toLowerCase()
    const version = req.parameters.version.toLowerCase()

    const [
      move,
      moveNames,
      moveDescriptions,
    ] = await Promise.all([
      fetchMoveData(version, id),
      fetchMoveNames(version),
      fetchMoveDescriptions(version),
    ])

    helica.json(
      res,
      moveView(move, moveNames, moveDescriptions),
    )
  }

}

class MoveBulk {

  async get (res, req) {
    const version = req.parameters.version.toLowerCase()
    const { moves } = queryString.parse(req.query)

    const [
      moveData,
      moveNames,
      moveDescriptions,
    ] = await Promise.all([
      fetchMoveData(version, moves.split(',').map((id) => id.toLowerCase())),
      fetchMoveNames(version),
      fetchMoveDescriptions(version),
    ])

    helica.json(
      res,
      moveBulkView(moveData, moveNames, moveDescriptions),
    )
  }

}

export function moveBulkView (moves, moveNames, moveDescriptions) {
  return moves.reduce((ax, move) => {
    ax[move.id] = moveView(move, moveNames, moveDescriptions)

    return ax
  }, {})
}

export function moveView (move, moveNames, moveDescriptions) {
  const power = parseInt(move.power)
  const effectChance = parseInt(move.effectChance)

  return {
    ...moveSummaryView(move, moveNames),
    description: getMoveDescription(moveDescriptions, move.id),
    category: quiet(move.category),
    type: quiet(move.type),
    power: power === 1 ? '??' : power === 0 ? '--' : power,
    accuracy: parseInt(move.accuracy),
    pp: parseInt(move.pp),
    effect: move.effect,
    effectChance: effectChance === 0 ? '--' : effectChance,
  }
}

export function moveSummaryView (move, moveNames) {
  return {
    id: move.id.toUpperCase(),
    name: findMoveName(moveNames, move.id),
  }
}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Move)
  app.addResource(`${basePath}${path}/:id`, MoveName)
  app.addResource(`${basePath}${path}/bulk`, MoveBulk)
})
