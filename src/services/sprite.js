import { spawn } from 'child_process'
import {
  join,
} from 'path'

import {
  PC_BASE_URL,
  PC_PAL_NORMAL,
  PC_PAL_SHINY,
  PC_SPRITE_PATH,
  PC_SPRITE,
} from '../utils/constants.js'

import {
  dirname,
} from '../utils/dirname.js'
import { request } from '../utils/request.js'

export function fetchSprite (pokemon, version) {
  const route = `${PC_BASE_URL}/${version}${PC_SPRITE_PATH}/${pokemon}`
  return request(`${route}${PC_SPRITE}`).then(({ body }) => body)
  // return fetch(`${route}${PC_SPRITE}`)
  //   .then(handleError)
  //   .then((res) => res.buffer())
}

export function fetchPAL (pokemon, version, shiny = false) {
  const route = `${PC_BASE_URL}/${version}${PC_SPRITE_PATH}/${pokemon}`
  return request(`${route}${shiny ? PC_PAL_SHINY : PC_PAL_NORMAL}`)
    .then(({ body }) => processPALFile(body.toString()))
  // return fetch(`${route}${shiny ? PC_PAL_SHINY : PC_PAL_NORMAL}`)
  //   .then(handleError)
  //   .then((res) => res.text())
  //   .then(processPALFile)
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
      join(dirname(import.meta), '../computations/process-image.py'),
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
