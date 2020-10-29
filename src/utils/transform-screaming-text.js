export function quiet (screamingText) {
  return screamingText
    .split('_')
    .map((word) => `${word[0]}${word.slice(1).toLowerCase()}`)
    .join(' ')
}
