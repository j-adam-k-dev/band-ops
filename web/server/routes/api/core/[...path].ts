// Proxies everything under /api/core/** to core-api (Fastify, :3001 by default).
// The browser calls same-origin /api/core/bands; Nitro forwards method, body,
// query and headers to the real service. Target host comes from runtimeConfig
// so it can be overridden per environment.
export default defineEventHandler((event) => {
  const { coreApiUrl } = useRuntimeConfig()
  const path = event.context.params?.path ?? ''
  const { search } = getRequestURL(event)
  return proxyRequest(event, `${coreApiUrl}/${path}${search}`)
})
