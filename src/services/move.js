import fetch from 'node-fetch'

import {
  PC_MOVE_NAMES,
  PC_BASE_URL,
  PC_MOVE_DATA,
  PC_MOVE_DESCRIPTIONS,
} from '../utils/constants.js'
import { readTwoPartText } from '../utils/read-crystal-text.js'

const MOVE_SUFFIX = '_M'

export function fetchMoveData (version, id) {
  return fetch(`${PC_BASE_URL}/${version}/${PC_MOVE_DATA}`)
    .then((res) => res.text())
    .then((text) => processMoveData(text, id))
}

export function fetchMoveNames (version) {
  return fetch(`${PC_BASE_URL}/${version}/${PC_MOVE_NAMES}`)
    .then((res) => res.text())
    .then((text) => [ ...text.matchAll(/db\s"(?<name>.+?)@/g) ].map((match) => match.groups.name))
}

export function findMoveName (moveNames, moveId) {
  const actualMove = moveId.endsWith(MOVE_SUFFIX)
    ? moveId.slice(0, (MOVE_SUFFIX.length * -1))
    : moveId

  return moveNames
    .find((name) =>
      name.toLowerCase().replace(/-|\s/g, '') === actualMove.toLowerCase().replace(/_/g, ''),
    )
}

export function processMoveData (text, id) {
  const regex = new RegExp(
    `move\\s${id && !Array.isArray(id) ? id : '(?<id>.+)'},\\s+(?<effect>.+),\\s+(?<power>\\d+),\\s+(?<type>\\w+),\\s+(?<accuracy>\\d+),\\s+(?<pp>\\d+),\\s+(?<effectChance>\\d+),\\s+(?<category>\\w+)\\n`, // eslint-disable-line max-len
    'gi',
  )

  const data = [ ...text.matchAll(regex) ].map((match) => ({
    ...match.groups,
    id: id && !Array.isArray(id) ? id : match.groups.id,
  }))

  if (id) {
    if (Array.isArray(id)) {
      return data.reduce((ax, moveData) => {
        if (id.includes(moveData.id.toLowerCase())) {
          const existingIndex = ax.findIndex((m) => m.id === moveData.id)
          if (existingIndex > -1) {
            ax[existingIndex] = combineUnfaithfulMoveData([
              ax[existingIndex],
              moveData,
            ])
          } else {
            ax.push(moveData)
          }
        }

        return ax
      }, [])
    }

    if (data.length === 1) {
      return data[0]
    }

    return combineUnfaithfulMoveData(data)
  }

  return data
}

export function combineUnfaithfulMoveData ([ faithful, unfaithful ]) {
  const diff = {}
  for (const key in faithful) {
    if (faithful[key] !== unfaithful[key]) {
      diff[key] = unfaithful[key]
    }
  }

  return {
    ...faithful,
    unfaithful: diff,
  }
}

export function fetchMoveDescriptions (version) {
  return fetch(`${PC_BASE_URL}/${version}/${PC_MOVE_DESCRIPTIONS}`)
    .then((res) => res.text())
}

export function getMoveDescription (text, id) {
  let clean = id.replace(/_/g, '').toLowerCase()
  clean = clean === 'brickbreak'
    ? 'rocksmash'
    : clean === 'rocksmash'
      ? 'crunch'
      : clean
  const regex = new RegExp(
    `${
      clean
    }description:.+?db\\s+"(?<first>.+?)".+?next\\s+"(?<second>.+?)@`,
    'is',
  )

  return readTwoPartText(text.match(regex).groups)
}
