<script setup lang="ts">
import type { Song } from '~/types'

const { data: songs, refresh } = await useFetch<Song[]>('/api/core/songs', {
  default: () => [],
})
const { send } = useApi()

const form = reactive<{
  title: string
  musicalKey: string
  tempoBpm: number | null
  durationSec: number | null
}>({ title: '', musicalKey: '', tempoBpm: null, durationSec: null })
const creating = ref(false)

async function create() {
  if (!form.title.trim()) return
  creating.value = true
  const { ok } = await send<Song>('/api/core/songs', {
    method: 'POST',
    body: {
      title: form.title.trim(),
      musicalKey: form.musicalKey.trim() || null,
      tempoBpm: form.tempoBpm ?? null,
      durationSec: form.durationSec ?? null,
    },
    successMessage: 'Song created',
  })
  creating.value = false
  if (ok) {
    Object.assign(form, { title: '', musicalKey: '', tempoBpm: null, durationSec: null })
    await refresh()
  }
}

async function remove(s: Song) {
  if (!confirm(`Delete "${s.title}"?`)) return
  const { ok } = await send(`/api/core/songs/${s.id}`, {
    method: 'DELETE',
    successMessage: 'Song deleted',
  })
  if (ok) await refresh()
}
</script>

<template>
  <div>
    <PageHeader title="Songs" subtitle="Your repertoire — used to build setlists." />

    <UCard class="mb-6">
      <form class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="create">
        <UFormField label="Title" class="lg:col-span-2">
          <UInput v-model="form.title" placeholder="Redshift" class="w-full" />
        </UFormField>
        <UFormField label="Key">
          <UInput v-model="form.musicalKey" placeholder="Am" class="w-full" />
        </UFormField>
        <UFormField label="Tempo (BPM)">
          <UInput v-model.number="form.tempoBpm" type="number" min="1" class="w-full" />
        </UFormField>
        <div class="flex items-end gap-3">
          <UFormField label="Length (sec)" class="flex-1">
            <UInput v-model.number="form.durationSec" type="number" min="1" class="w-full" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-plus" :loading="creating" aria-label="Add song" />
        </div>
      </form>
    </UCard>

    <UCard>
      <div v-if="songs.length" class="divide-y divide-default">
        <div
          v-for="s in songs"
          :key="s.id"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div>
            <div class="font-medium">{{ s.title }}</div>
            <div class="flex gap-3 text-sm text-muted">
              <span>{{ s.musicalKey || '—' }}</span>
              <span>{{ s.tempoBpm ? `${s.tempoBpm} BPM` : '—' }}</span>
              <span>{{ formatDuration(s.durationSec) }}</span>
            </div>
          </div>
          <UButton
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Delete song"
            @click="remove(s)"
          />
        </div>
      </div>
      <p v-else class="text-muted">No songs yet — add your first above.</p>
    </UCard>
  </div>
</template>
