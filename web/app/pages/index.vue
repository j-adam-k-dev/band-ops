<script setup lang="ts">
import type { Band, Venue, Song, Gig } from '~/types'

const { data: bands } = await useFetch<Band[]>('/api/core/bands', { default: () => [] })
const { data: venues } = await useFetch<Venue[]>('/api/core/venues', { default: () => [] })
const { data: songs } = await useFetch<Song[]>('/api/core/songs', { default: () => [] })
const { data: gigs } = await useFetch<Gig[]>('/api/core/gigs', { default: () => [] })

const stats = computed(() => [
  { label: 'Bands', to: '/bands', icon: 'i-lucide-users', count: bands.value.length },
  { label: 'Venues', to: '/venues', icon: 'i-lucide-map-pin', count: venues.value.length },
  { label: 'Songs', to: '/songs', icon: 'i-lucide-music', count: songs.value.length },
  { label: 'Gigs', to: '/gigs', icon: 'i-lucide-calendar-days', count: gigs.value.length },
])

const upcoming = computed(() =>
  [...gigs.value]
    .filter((g) => g.status !== 'cancelled')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 5),
)

const statusColor = (s: Gig['status']) =>
  ({ planned: 'neutral', confirmed: 'success', cancelled: 'error', completed: 'info' })[s] as
    | 'neutral'
    | 'success'
    | 'error'
    | 'info'
</script>

<template>
  <div>
    <PageHeader title="Dashboard" subtitle="Everything your band needs to run a gig." />

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UCard
        v-for="s in stats"
        :key="s.to"
        class="transition hover:ring-2 hover:ring-primary/40"
      >
        <NuxtLink :to="s.to" class="flex items-center gap-4">
          <div class="rounded-lg bg-elevated p-3">
            <UIcon :name="s.icon" class="size-6 text-primary" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ s.count }}</div>
            <div class="text-sm text-muted">{{ s.label }}</div>
          </div>
        </NuxtLink>
      </UCard>
    </div>

    <h2 class="mb-3 mt-10 text-lg font-semibold">Upcoming gigs</h2>
    <UCard>
      <div v-if="upcoming.length" class="divide-y divide-default">
        <NuxtLink
          v-for="g in upcoming"
          :key="g.id"
          :to="`/gigs`"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div>
            <div class="font-medium">{{ g.venue?.name ?? 'Unknown venue' }}</div>
            <div class="text-sm text-muted">{{ formatDate(g.date) }}</div>
          </div>
          <UBadge :color="statusColor(g.status)" variant="subtle">{{ g.status }}</UBadge>
        </NuxtLink>
      </div>
      <p v-else class="text-muted">
        No gigs yet. Add one under <NuxtLink to="/gigs" class="text-primary">Gigs</NuxtLink>.
      </p>
    </UCard>
  </div>
</template>
