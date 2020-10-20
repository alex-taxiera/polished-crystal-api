export async function handleError (res) {
  if (!res.ok) {
    throw Error(res.status)
  }

  return res
}
