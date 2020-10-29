export function routeLoader (cb) {
  return function (app, basePath) {
    cb(
      app,
      basePath ?? '',
    )
  }
}
