<script setup lang="ts">
import type { Venue } from '~/types'

const { data: venues, refresh } = await useFetch<Venue[]>('/api/core/venues', {
  default: () => [],
})
const { send } = useApi()

const form = reactive({ name: '', address: '', contact: '', isOutdoor: false })
const creating = ref(false)

async function create() {
  if (!form.name.trim()) return
  creating.value = true
  const { ok } = await send<Venue>('/api/core/venues', {
    method: 'POST',
    body: {
      name: form.name.trim(),
      address: form.address.trim() || null,
      contact: form.contact.trim() || null,
      isOutdoor: form.isOutdoor,
    },
    successMessage: 'Venue created',
  })
  creating.value = false
  if (ok) {
    Object.assign(form, { name: '', address: '', contact: '', isOutdoor: false })
    await refresh()
  }
}

async function remove(v: Venue) {
  if (!confirm(`Delete "${v.name}"?`)) return
  const { ok } = await send(`/api/core/venues/${v.id}`, {
    method: 'DELETE',
    successMessage: 'Venue deleted',
  })
  if (ok) await refresh()
}
</script>

<template>
  <div>
    <PageHeader title="Venues" subtitle="Where the gigs happen." />

    <UCard class="mb-6">
      <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="create">
        <UFormField label="Name">
          <UInput v-model="form.name" placeholder="The Basement" class="w-full" />
        </UFormField>
        <UFormField label="Address">
          <UInput v-model="form.address" placeholder="14 Cellar St" class="w-full" />
        </UFormField>
        <UFormField label="Contact">
          <UInput v-model="form.contact" placeholder="booking@..." class="w-full" />
        </UFormField>
        <div class="flex items-end justify-between gap-3">
          <USwitch v-model="form.isOutdoor" label="Outdoor venue" />
          <UButton type="submit" icon="i-lucide-plus" :loading="creating">Add venue</UButton>
        </div>
      </form>
    </UCard>

    <UCard>
      <div v-if="venues.length" class="divide-y divide-default">
        <div
          v-for="v in venues"
          :key="v.id"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div>
            <div class="flex items-center gap-2 font-medium">
              {{ v.name }}
              <UBadge
                :color="v.isOutdoor ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ v.isOutdoor ? 'outdoor' : 'indoor' }}
              </UBadge>
            </div>
            <div class="text-sm text-muted">{{ v.address || 'no address' }}</div>
          </div>
          <UButton
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Delete venue"
            @click="remove(v)"
          />
        </div>
      </div>
      <p v-else class="text-muted">No venues yet — add your first above.</p>
    </UCard>
  </div>
</template>
