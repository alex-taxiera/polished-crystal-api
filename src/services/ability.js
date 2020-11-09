import fetch from 'node-fetch'
import {
  PC_ABILITY_DESCRIPTIONS,
  PC_ABILITY_NAMES,
  PC_BASE_URL,
} from '../utils/constants.js'
import { handleError } from '../utils/fetch-handle-error.js'
import { readTwoPartText } from '../utils/read-crystal-text.js'

export function listAbilities (version) {
  const route = `${PC_BASE_URL}/${version}/${PC_ABILITY_NAMES}`

  return fetch(route)
    .then(handleError)
    .then((res) => res.text())
    .then(processAbilityNames)
}

export function processAbilityNames (file) {
  const regex = /rawchar\s"(?<name>.+?)@/g

  return [ ...file.matchAll(regex) ]
    .map((match) => match.groups.name)
    .filter((ability) => ability !== '---')
}

export function fetchAbility (version, ability) {
  const route = `${PC_BASE_URL}/${version}/${PC_ABILITY_DESCRIPTIONS}`

  return fetch(route)
    .then(handleError)
    .then((res) => res.text())
    .then((text) => readAbilityDescription(text, ability))
}

export function readAbilityDescription (text, ability) {
  const regex = new RegExp(
    `${
      ability
    }description:.+?db\\s+"(?<first>.+?)".+?next1\\s+"(?<second>.+?)@`,
    'si',
  )

  return readTwoPartText(text.match(regex).groups)
}
