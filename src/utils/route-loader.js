export function routeLoader (cb) {
  return function (app, basePath) {
    cb(
      app,
      !basePath
        ? ''
        : `${
          !basePath.startsWith('/') ? '/' : ''
        }${
          basePath
        }${
          !basePath.endsWith('/') ? '/' : ''
        }`,
    )
  }
}
