import {
  routeLoader,
} from '../utils/route-loader.js'

const path = '*'

class Options {

  options (res) {
    res.writeHeader('Connection', 'keep-alive')
    res.writeHeader(
      'Access-Control-Allow-Methods',
      'POST, GET, OPTIONS, DELETE',
    )
    res.writeHeader('Access-Control-Max-Age', 86400)
    res.writeHeader('Content-Length', '0')
    res.writeStatus('204')
    res.end()
  }

}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}`, Options)
})
