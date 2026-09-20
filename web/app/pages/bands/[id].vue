<script setup lang="ts">
import type { Band } from '~/types'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { data: band, refresh, error } = await useFetch<Band>(`/api/core/bands/${id}`)
const { send } = useApi()

const mName = ref('')
const mRole = ref('')
const adding = ref(false)

async function addMember() {
  if (!mName.value.trim()) return
  adding.value = true
  const { ok } = await send('/api/core/members', {
    method: 'POST',
    body: { bandId: id, name: mName.value.trim(), role: mRole.value.trim() || null },
    successMessage: 'Member added',
  })
  adding.value = false
  if (ok) {
    mName.value = ''
    mRole.value = ''
    await refresh()
  }
}

async function removeMember(memberId: string, name: string) {
  if (!confirm(`Remove ${name}?`)) return
  const { ok } = await send(`/api/core/members/${memberId}`, {
    method: 'DELETE',
    successMessage: 'Member removed',
  })
  if (ok) await refresh()
}

async function deleteBand() {
  if (!confirm('Delete this band? Remove its members first if this fails.')) return
  const { ok } = await send(`/api/core/bands/${id}`, {
    method: 'DELETE',
    successMessage: 'Band deleted',
  })
  if (ok) router.push('/bands')
}
</script>

<template>
  <div>
    <UButton
      to="/bands"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4 -ml-2"
    >
      Back to bands
    </UButton>

    <div v-if="error">
      <UAlert
        color="error"
        variant="subtle"
        title="Band not found"
        :description="`No band with id ${id}.`"
        icon="i-lucide-triangle-alert"
      />
    </div>

    <div v-else-if="band">
      <PageHeader :title="band.name" subtitle="Members of this band.">
        <template #actions>
          <UButton color="error" variant="soft" icon="i-lucide-trash-2" @click="deleteBand">
            Delete band
          </UButton>
        </template>
      </PageHeader>

      <UCard class="mb-6">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="addMember">
          <UFormField label="Name" class="flex-1">
            <UInput v-model="mName" placeholder="Ava Rhodes" class="w-full" />
          </UFormField>
          <UFormField label="Role" class="flex-1">
            <UInput v-model="mRole" placeholder="vocals" class="w-full" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-user-plus" :loading="adding">Add member</UButton>
        </form>
      </UCard>

      <UCard>
        <div v-if="band.members?.length" class="divide-y divide-default">
          <div
            v-for="m in band.members"
            :key="m.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <div class="font-medium">{{ m.name }}</div>
              <div class="text-sm text-muted">{{ m.role || 'no role set' }}</div>
            </div>
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              aria-label="Remove member"
              @click="removeMember(m.id, m.name)"
            />
          </div>
        </div>
        <p v-else class="text-muted">No members yet — add one above.</p>
      </UCard>
    </div>
  </div>
</template>
