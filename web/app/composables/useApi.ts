import type { ApiError } from '~/types'

// Thin wrapper over $fetch for mutations that centralizes toast feedback and
// unpacks the APIs' standard error body ({ error, message, details[] }) into a
// readable message. Returns { ok } so callers can branch — ok stays true even
// for a 204 (delete) where there's no response body.
export function useApi() {
  const toast = useToast()

  async function send<T>(
    url: string,
    opts: Parameters<typeof $fetch<T>>[1] & { successMessage?: string } = {},
  ): Promise<{ ok: boolean; data?: T }> {
    const { successMessage, ...fetchOpts } = opts
    try {
      const data = await $fetch<T>(url, fetchOpts)
      if (successMessage) {
        toast.add({ title: successMessage, color: 'success', icon: 'i-lucide-check' })
      }
      return { ok: true, data }
    } catch (e) {
      const body = (e as { data?: ApiError })?.data
      const description =
        body?.details?.map((d) => `${d.path}: ${d.message}`).join('\n') ??
        body?.message ??
        (e as Error)?.message ??
        'Request failed'
      toast.add({
        title: 'Something went wrong',
        description,
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
      return { ok: false }
    }
  }

  return { send }
}
