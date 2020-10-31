import https from 'https'
import http from 'http'
import zlib from 'zlib'

import FormData from 'form-data'

export const requesters = {
  'http:': http,
  'https:': https,
}

export const decompressors = {
  deflate: zlib.createInflate,
  gzip: zlib.createGunzip,
}

export function request (
  url,
  options = {},
) {
  const {
    method = 'GET',
    body,
    timeout,
    ...reqOptions
  } = options

  if (!http.METHODS.includes(method.toUpperCase())) {
    return Promise.reject(Error(`INVALID METHOD: ${method.toUpperCase()}`))
  }

  const address = new URL(url)
  const protocol = requesters[address.protocol]
  if (!protocol) {
    return Promise.reject(Error(`INVALID PROTOCOL: ${address.protocol}`))
  }

  return new Promise((resolve, reject) => {
    const req = protocol.request(address, { ...reqOptions, method })

    if (body) {
      if (body instanceof FormData) {
        body.pipe(req)
      } else {
        req.write(body)
        req.end()
      }
    } else {
      req.end()
    }

    if (body && body instanceof FormData) {
      body.pipe(req)
    } else if (body) {
      req.write(body)
      req.end()
    } else {
      req.end()
    }

    if (timeout) {
      req.setTimeout(timeout)
    }

    req
      .once('error', reject)
      .once('timeout', () => req.destroy(new Error('REQUEST TIMED OUT')))
      .once('response', (res) => {
        const chunks = []

        const decompressor = decompressors[res.headers['content-encoding']]
        const stream = decompressor ? res.pipe(decompressor()) : res

        stream
          .once('aborted', reject)
          .once('error', reject)
          .on('data', (chunk) => chunks.push(chunk))
          .once('end', () => {
            if (res.complete) {
              resolve({
                req, res, body: Buffer.concat(chunks),
              })
            } else {
              reject(Error('REQUEST NOT COMPLETED'))
            }
          })
      })
  })
}
