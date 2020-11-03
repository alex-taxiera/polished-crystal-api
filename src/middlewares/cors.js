import config from 'config'

export function originHeaders (res) {
  res.writeHeader(
    'Access-Control-Allow-Origin',
    config.get('WEB_DOMAIN'),
  )
  res.writeHeader('Vary', 'Origin')
}
