export function readTwoPartText ({ first, second }) {
  const removeDash = first.endsWith('-') &&
    !second.startsWith('strike') &&
    !second.startsWith('type')
  const addSpace = !removeDash && !first.endsWith('-')

  const firstPart = removeDash
    ? first.slice(0, -1)
    : first
  const secondPart = addSpace
    ? ` ${second}`
    : second

  return `${firstPart}${secondPart}`
}
