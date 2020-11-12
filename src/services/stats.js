import fetch from 'node-fetch'

import {
  GH_API_URL,
  PC_BASE_URL,
  PC_BASE_STATS_PATH,
  PC_EVOS_ATTACKS,
} from '../utils/constants.js'
import { handleError } from '../utils/fetch-handle-error.js'
import { ghHeaders } from '../utils/github-headers.js'
import { quiet } from '../utils/transform-screaming-text.js'
import { splitAndTakeOne } from '../utils/split-and-take-one.js'

export async function fetchVersions () {
  const query = `query {
    repository(name: "polishedcrystal", owner: "Rangi42") {
      refs(refPrefix: "refs/tags/", last:10) { nodes { name } }
    }
  }`

  return fetch(GH_API_URL, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: ghHeaders(),
  })
    .then(handleError)
    .then((res) => res.json())
    .then(({ data }) => data.repository.refs.nodes)
}

export function fetchEvosMoves (pokemon, version) {
  const route = `${PC_BASE_URL}/${version}${PC_EVOS_ATTACKS}`
  return fetch(route)
    .then(handleError)
    .then((res) => res.text())
    .then((text) => processEvosAttacksFile(text, pokemon))
}

export function fetchBaseStats (pokemon, version) {
  const route = `${PC_BASE_URL}/${version}${PC_BASE_STATS_PATH}/${pokemon}.asm`
  return fetch(route)
    .then(handleError)
    .then((res) => res.text())
    .then(processBaseStatsFile)
}

export function processEvosAttacksFile (file, pokemon) {
  const regexp = new RegExp(
    `${pokemon}evosattacks:+?\n(?<text>.+?) ; no more level-up moves`,
    'is',
  )
  const {
    groups: {
      text,
    },
  } = file.match(regexp)
  const faithful = {
    evolutions: [],
    moves: [],
  }
  const unfaithful = {}

  const lines = text.replace(/\t/g, '').split('\n')
  let hasFaithful = false

  let i = 0
  for (i; i < lines.length; i++) {
    if (lines[i].startsWith('db 0')) {
      i++
      break
    }

    if (lines[i] === 'if DEF(FAITHFUL)') {
      hasFaithful = true
      i++
      if (!unfaithful.evolutions) {
        unfaithful.evolutions = []
      }
      for (const end of [ 'else', 'endc' ]) {
        const store = end === 'else' ? faithful : unfaithful
        for (i; lines[i] !== end; i++) {
          store.evolutions.push(readEvolutionLine(lines[i]))
        }

        i++
      }

      i--
    } else if (lines[i] === 'if !DEF(FAITHFUL)') {
      hasFaithful = true
      if (!unfaithful.evolutions) {
        unfaithful.evolutions = []
      }
      unfaithful.evolutions.push(readEvolutionLine(lines[++i]))
      i++
    } else {
      faithful.evolutions.push(readEvolutionLine(lines[i]))
    }
  }

  for (i; i < lines.length; i++) {
    if (lines[i].startsWith('db 0')) {
      break
    }

    if (lines[i] === 'if DEF(FAITHFUL)') {
      hasFaithful = true
      i++
      if (!unfaithful.moves) {
        unfaithful.moves = []
      }
      for (const end of [ 'else', 'endc' ]) {
        const store = end === 'else' ? faithful : unfaithful

        for (i; lines[i] !== end; i++) {
          store.moves.push(readMoveLine(lines[i]))
        }

        i++
      }
    } else if (lines[i] === 'if !DEF(FAITHFUL)') {
      hasFaithful = true
      if (!unfaithful.moves) {
        unfaithful.moves = []
      }

      unfaithful.moves.push(readMoveLine(lines[++i]))
      i++
    } else {
      faithful.moves.push(readMoveLine(lines[i]))
    }
  }

  return hasFaithful ? { faithful, unfaithful } : faithful
}

export function readMoveLine (line) {
  const [
    level,
    move,
  ] = line
    .split(/\s+/)
    .filter((_, j) => j > 0 && j < 3)
    .join('')
    .split(',')

  return {
    level: parseInt(level),
    id: move,
    evolution: line.endsWith('; evolution move'),
  }
}

export function readEvolutionLine (line) {
  const [
    type,
    requirement,
    to,
  ] = line
    .split(/\s+/)
    .filter((_, j) => j > 0 && j < 4)
    .join('')
    .split(',')

  return {
    type: quiet(type.split('_')[1]),
    requirement: quiet(requirement),
    to: {
      id: to,
    },
  }
}

export function processStepForBaseStats (store, lines, lineNumber, step) {
  const numLines = step.lines ?? 1
  const currentLines = lines
    .slice(lineNumber, lineNumber + numLines)
  const linesToPass = numLines === 1
    ? currentLines[0]
    : currentLines

  if (Array.isArray(step.name)) {
    const data = step.processor(linesToPass)

    for (const name of step.name) {
      store[name] = data[name]
    }
  } else {
    store[step.name] = step.processor(linesToPass)
  }

  return lineNumber + numLines
}

export function processBaseStatsFile (baseStatsString) {
  const lines = baseStatsString
    .split('\n')
    .map((line) => line.replace(/\t/g, ''))
    .filter(
      (line) => line &&
        !line.startsWith('INCBIN') &&
        !line.startsWith('; assumes') &&
        !line.includes('frontpic dimensions'),
    )

  const unfaithful = {}
  const faithful = {}

  const steps = [
    {
      name: 'baseStats',
      lines: 2,
      processor: readBaseStatLines,
    },
    {
      name: 'types',
      processor: readTypesLine,
    },
    {
      name: 'catchRate',
      processor: (line) => parseInt(splitAndTakeOne(line, 1)),
    },
    {
      name: 'baseExp',
      processor: (line) => parseInt(splitAndTakeOne(line, 1)),
    },
    {
      name: 'heldItems',
      lines: 2,
      processor: readHeldItemLines,
    },
    {
      name: [
        'gender',
        'hatchCycles',
      ],
      processor: readBreedData,
    },
    {
      name: 'abilities',
      processor: readAbilities,
    },
    {
      name: 'growthRate',
      processor: (line) => quiet(splitAndTakeOne(line, 1)),
    },
    {
      name: 'eggGroups',
      processor: (line) => [
        ...new Set(
          line
            .split(/\s+/)
            .filter((_, i) => i > 0 && i < 3)
            .join('')
            .split(',')
            .map(quiet),
        ),
      ],
    },
    {
      name: 'evYield',
      lines: 2,
      processor: readEVLines,
    },
    {
      name: 'tms',
      lines: 2,
      processor: ([ _, tms ]) =>
        tms
          .split(/\s+/)
          .filter((_, i) => i > 0)
          .join('')
          .split(','),
    },
  ]

  let hasFaithful = false

  let lineNumber = 0
  for (let step = 0; step < steps.length; step++) {
    if (lines[lineNumber] === 'if DEF(FAITHFUL)') {
      lineNumber++
      hasFaithful = true

      const currentStepIndex = step
      for (const end of [ 'else', 'endc' ]) {
        step = currentStepIndex
        const store = end === 'else' ? faithful : unfaithful

        while (lines[lineNumber] !== end) {
          const currentStep = steps[step]

          lineNumber = processStepForBaseStats(
            store,
            lines,
            lineNumber,
            currentStep,
          )

          step++
        }
        lineNumber++
      }

      step--
    } else {
      const currentStep = steps[step]

      lineNumber = processStepForBaseStats(
        faithful,
        lines,
        lineNumber,
        currentStep,
      )
    }
  }

  return hasFaithful ? { faithful, unfaithful } : faithful
}

export function readBaseStatLines ([ stats, labels ]) {
  const cleanStats = stats.split(/\s+/).filter((_, i) => i > 0 && i < 7).join('').split(',')
  const cleanLabels = labels.split(/\s+/).filter((_, i) => i > 0)

  return cleanStats.reduce((ax, stat, cx) => {
    ax[cleanLabels[cx]] = parseInt(stat)

    return ax
  }, {})
}

export function readTypesLine (line) {
  return [
    ...new Set(
      line
        .split(/\s+/)
        .filter((_, i) => i > 0)
        .join('')
        .split(',')
        .map(quiet),
    ),
  ]
}

export function readHeldItemLines (lines) {
  return [
    ...new Set(
      lines
        .map((line) => quiet(line.split(/\s+/)[1]))
        .filter((item) => item !== 'No Item' && item !== 'Always Item 2'),
    ),
  ]
}

export function readBreedData (line) {
  const [ gender, hatchCycles ] = line
    .split(/\s+/)
    .filter((_, i) => i > 0 && i < 3)
    .join('')
    .split(',')

  const genderData = {
    genderless: false,
  }
  if (gender === 'GENDERLESS') {
    genderData.genderless = true
  } else {
    genderData.female = parseFloat(
      gender.split('_').filter((_, i) => i > 0).join('.'),
    )
    genderData.male = 100 - genderData.female
  }
  return {
    gender: genderData,
    hatchCycles: parseInt(hatchCycles),
  }
}

export function readAbilities (line) {
  const [
    one,
    two,
    hidden,
  ] = line
    .split(/\s+/)
    .filter((_, i) => i > 1)
    .join('')
    .split(',')
    .map(quiet)

  return {
    one,
    two,
    hidden,
  }
}

export function readEVLines ([ evs, labels ]) {
  const cleanEvs = evs.split(/\s+/).filter((_, i) => i > 0 && i < 7).join('').split(',')
  const cleanLabels = labels.split(/\s+/).filter((_, i) => i > 0).join('').split(',')

  return cleanEvs.reduce((ax, ev, cx) => {
    ax[cleanLabels[cx]] = parseInt(ev)

    return ax
  }, {})
}
