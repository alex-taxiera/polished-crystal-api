import config from 'config'

export function ghHeaders () {
  const token = config.get('GH_API_TOKEN')

  return {
    Authorization: `Bearer ${token}`,
  }
}
