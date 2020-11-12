import { titleCase } from './title-case.js'

export function quiet (screamingText) {
  return screamingText
    .split('_')
    .map(titleCase)
    .join(' ')
}
