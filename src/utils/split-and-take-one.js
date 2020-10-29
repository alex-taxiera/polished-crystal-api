export function splitAndTakeOne (str, index = 0, delimiter = /\s+/) {
  return str.split(delimiter)[index]
}
