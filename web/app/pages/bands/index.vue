<script setup lang="ts">
import type { Band } from '~/types'

const { data: bands, refresh } = await useFetch<Band[]>('/api/core/bands', {
  default: () => [],
})
const { send } = useApi()

const name = ref('')
const creating = ref(false)

async function create() {
  if (!name.value.trim()) return
  creating.value = true
  const { ok } = await send<Band>('/api/core/bands', {
    method: 'POST',
    body: { name: name.value.trim() },
    successMessage: 'Band created',
  })
  creating.value = false
  if (ok) {
    name.value = ''
    await refresh()
  }
}

async function remove(b: Band) {
  if (!confirm(`Delete "${b.name}"? This can't be undone.`)) return
  const { ok } = await send(`/api/core/bands/${b.id}`, {
    method: 'DELETE',
    successMessage: 'Band deleted',
  })
  if (ok) await refresh()
}
</script>

<template>
  <div>
    <PageHeader title="Bands" subtitle="The acts you manage and their members." />

    <UCard class="mb-6">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="create">
        <UFormField label="Band name" class="flex-1">
          <UInput v-model="name" placeholder="The Void Callers" class="w-full" />
        </UFormField>
        <UButton type="submit" icon="i-lucide-plus" :loading="creating">Add band</UButton>
      </form>
    </UCard>

    <UCard>
      <div v-if="bands.length" class="divide-y divide-default">
        <div
          v-for="b in bands"
          :key="b.id"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <NuxtLink :to="`/bands/${b.id}`" class="group">
            <div class="font-medium group-hover:text-primary">{{ b.name }}</div>
            <div class="text-sm text-muted">
              {{ b.members?.length ?? 0 }}
              {{ (b.members?.length ?? 0) === 1 ? 'member' : 'members' }}
            </div>
          </NuxtLink>
          <div class="flex items-center gap-1">
            <UButton
              :to="`/bands/${b.id}`"
              variant="ghost"
              color="neutral"
              icon="i-lucide-chevron-right"
              aria-label="Open band"
            />
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              aria-label="Delete band"
              @click="remove(b)"
            />
          </div>
        </div>
      </div>
      <p v-else class="text-muted">No bands yet — add your first above.</p>
    </UCard>
  </div>
</template>
