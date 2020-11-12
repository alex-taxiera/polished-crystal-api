import fetch from 'node-fetch'

import {
  GH_API_URL,
  PC_BASE_URL,
  PC_POKEMON_NAMES,
} from '../utils/constants.js'
import { handleError } from '../utils/fetch-handle-error.js'
import { ghHeaders } from '../utils/github-headers.js'

export async function listPokemon (tag, path) {
  const query = `query { 
    repository(name: "polishedcrystal", owner: "Rangi42") {
      object(expression: "${tag}:${
        path.startsWith('/') ? path.slice(1) : path
      }") {
        ... on Tree {
          entries {
            name
            type
          }
        }
      }
    }
  }`

  return fetch(GH_API_URL, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: ghHeaders(),
  })
    .then(handleError)
    .then((res) => res.json())
    .then(({ data }) => data.repository.object.entries)
}

export function fetchPokemonNames (version, id) {
  const route = `${PC_BASE_URL}/${version}/${PC_POKEMON_NAMES}`
  return fetch(route)
    .then(handleError)
    .then((res) => res.text())
}

export function processPokemonNames (text, id) {
  const regex = new RegExp(`rawchar\\s+"(?<name>${id ? id.replace(/_+/g, '.+?') : '.+?'})(@|")`, 'gi')
  const data = [ ...text.matchAll(regex) ].map((match) => match.groups.name)

  return id ? data[0] : data
}
