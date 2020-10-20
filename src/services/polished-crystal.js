import { spawn } from 'child_process'
import {
  join,
  dirname,
} from 'path'
import { fileURLToPath } from 'url'

import fetch from 'node-fetch'

import {
  PC_BASE_URL,
  PC_PAL_NORMAL,
  PC_PAL_SHINY,
  PC_POKEMON_ROUTE,
  PC_SPRITE,
} from '../utils/constants.js'
import { handleError } from '../utils/fetch-handle-error.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function fetchPokemonResources (
  pokemon,
  palPokemon,
) {
  const route = `${PC_BASE_URL}${PC_POKEMON_ROUTE}/${pokemon}`
  const palRoute = palPokemon
    ? `${PC_BASE_URL}${PC_POKEMON_ROUTE}/${palPokemon}`
    : route

  const [
    spriteBuffer,
    normalPAL,
    shinyPAL,
  ] = await Promise.all([
    fetch(`${route}${PC_SPRITE}`)
      .then(handleError)
      .then((res) => res.buffer()),
    fetch(`${palRoute}${PC_PAL_NORMAL}`)
      .then(handleError)
      .then((res) => res.text())
      .then(processPALFile),
    fetch(`${palRoute}${PC_PAL_SHINY}`)
      .then(handleError)
      .then((res) => res.text())
      .then(processPALFile),
  ])

  return {
    spriteBuffer,
    normalPAL,
    shinyPAL,
  }
}

export function processPALFile (palString) {
  const [
    primary,
    secondary,
  ] = palString
    .replace(/\tRGB/g, '')
    .trim()
    .split('\n')
    .map((x) => x.trim().split(',').map((y) => parseInt(y.trim())))

  return {
    primary,
    secondary,
  }
}

export async function processImage (base64, pal, scale) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [
      join(__dirname, '../computations/process-image.py'),
    ])

    py
      .on('error', reject)
      .on('disconnect', reject)
      .on('close', () => resolve(
        Buffer.from(
          Buffer.concat(chunks).toString(),
          'base64',
        ),
      ))

    const chunks = []
    py.stdout.on('data', (chunk) => chunks.push(chunk))

    py.stdin.write(JSON.stringify({
      sprite: base64,
      pal,
      scale: scale ? parseInt(scale) : undefined,
    }))
    py.stdin.end()
  })
}
