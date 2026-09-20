<script setup lang="ts">
const links = [
  { label: 'Dashboard', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Bands', to: '/bands', icon: 'i-lucide-users' },
  { label: 'Venues', to: '/venues', icon: 'i-lucide-map-pin' },
  { label: 'Songs', to: '/songs', icon: 'i-lucide-music' },
  { label: 'Gigs', to: '/gigs', icon: 'i-lucide-calendar-days' },
]

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v) => (colorMode.preference = v ? 'dark' : 'light'),
})
</script>

<template>
  <div class="min-h-screen bg-default text-default">
    <header
      class="sticky top-0 z-10 border-b border-default bg-default/80 backdrop-blur"
    >
      <UContainer class="flex h-16 items-center gap-2">
        <NuxtLink to="/" class="mr-2 flex items-center gap-2 text-lg font-bold">
          <UIcon name="i-lucide-guitar" class="text-primary" />
          <span>Band Ops</span>
        </NuxtLink>

        <nav class="flex items-center gap-1">
          <UButton
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :icon="l.icon"
            variant="ghost"
            color="neutral"
            active-class="text-primary"
          >
            <span class="hidden sm:inline">{{ l.label }}</span>
          </UButton>
        </nav>

        <UButton
          class="ml-auto"
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          variant="ghost"
          color="neutral"
          aria-label="Toggle color mode"
          @click="isDark = !isDark"
        />
      </UContainer>
    </header>

    <UContainer class="py-8">
      <slot />
    </UContainer>
  </div>
</template>
