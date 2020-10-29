import helica from 'helica'

import {
  fetchVersions,
} from '../services/stats.js'
import {
  routeLoader,
} from '../utils/route-loader.js'

const path = '/polished-crystal'

// class PolishedCrystal {

//   get (res) {
//     helica.send(res, 'use sprite/:name')
//   }

// }

class PolishedCrystalVersions {

  async get (res) {
    const nodes = await fetchVersions()
    helica.json(res, nodes.map((node) => node.name).reverse())
  }

}

export const loadRoute = routeLoader((app, basePath) => {
  app.addResource(`${basePath}${path}/versions`, PolishedCrystalVersions)
})
