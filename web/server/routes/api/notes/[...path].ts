// Proxies everything under /api/notes/** to notes-api (Fastify, :3002 by default).
// See the core proxy for the rationale.
export default defineEventHandler((event) => {
  const { notesApiUrl } = useRuntimeConfig()
  const path = event.context.params?.path ?? ''
  const { search } = getRequestURL(event)
  return proxyRequest(event, `${notesApiUrl}/${path}${search}`)
})
