<script setup lang="ts">
import type { Gig, Venue, GigStatus } from '~/types'

const { data: gigs, refresh } = await useFetch<Gig[]>('/api/core/gigs', { default: () => [] })
const { data: venues } = await useFetch<Venue[]>('/api/core/venues', { default: () => [] })
const { send } = useApi()

const statuses: GigStatus[] = ['planned', 'confirmed', 'cancelled', 'completed']
const statusItems = statuses.map((s) => ({ label: s, value: s }))
const venueItems = computed(() =>
  venues.value.map((v) => ({ label: v.name, value: v.id })),
)

const form = reactive<{ venueId?: string; date: string; status: GigStatus }>({
  venueId: undefined,
  date: '',
  status: 'planned',
})
const creating = ref(false)

async function create() {
  if (!form.venueId || !form.date) return
  creating.value = true
  const { ok } = await send<Gig>('/api/core/gigs', {
    method: 'POST',
    body: {
      venueId: form.venueId,
      date: new Date(form.date).toISOString(),
      status: form.status,
    },
    successMessage: 'Gig created',
  })
  creating.value = false
  if (ok) {
    Object.assign(form, { venueId: undefined, date: '', status: 'planned' })
    await refresh()
  }
}

async function remove(g: Gig) {
  if (!confirm(`Delete the gig at ${g.venue?.name ?? 'this venue'}?`)) return
  const { ok } = await send(`/api/core/gigs/${g.id}`, {
    method: 'DELETE',
    successMessage: 'Gig deleted',
  })
  if (ok) await refresh()
}

const statusColor = (s: GigStatus) =>
  ({ planned: 'neutral', confirmed: 'success', cancelled: 'error', completed: 'info' })[s] as
    | 'neutral'
    | 'success'
    | 'error'
    | 'info'

const sortedGigs = computed(() =>
  [...gigs.value].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
)
</script>

<template>
  <div>
    <PageHeader title="Gigs" subtitle="Scheduled shows and their setlists." />

    <UCard class="mb-6">
      <form class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="create">
        <UFormField label="Venue">
          <USelect
            v-model="form.venueId"
            :items="venueItems"
            placeholder="Select a venue"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Date & time">
          <UInput v-model="form.date" type="datetime-local" class="w-full" />
        </UFormField>
        <UFormField label="Status">
          <USelect v-model="form.status" :items="statusItems" class="w-full" />
        </UFormField>
        <UButton
          type="submit"
          icon="i-lucide-plus"
          :loading="creating"
          :disabled="!venues.length"
        >
          Add gig
        </UButton>
      </form>
      <p v-if="!venues.length" class="mt-3 text-sm text-muted">
        Add a <NuxtLink to="/venues" class="text-primary">venue</NuxtLink> first.
      </p>
    </UCard>

    <UCard>
      <div v-if="sortedGigs.length" class="divide-y divide-default">
        <div
          v-for="g in sortedGigs"
          :key="g.id"
          class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div>
            <div class="font-medium">{{ g.venue?.name ?? 'Unknown venue' }}</div>
            <div class="text-sm text-muted">{{ formatDate(g.date) }}</div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge v-if="g.setlist" color="primary" variant="subtle" size="sm">
              {{ g.setlist.name }} · {{ g.setlist.songs?.length ?? 0 }} songs
            </UBadge>
            <UBadge v-else color="neutral" variant="subtle" size="sm">no setlist</UBadge>
            <UBadge :color="statusColor(g.status)" variant="subtle">{{ g.status }}</UBadge>
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              aria-label="Delete gig"
              @click="remove(g)"
            />
          </div>
        </div>
      </div>
      <p v-else class="text-muted">No gigs yet — schedule your first above.</p>
    </UCard>
  </div>
</template>
