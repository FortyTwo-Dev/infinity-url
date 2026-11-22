<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ public: true })

const auth = useAuthStore()
const localePath = useLocalePath()

await auth.bootstrap()
await navigateTo(localePath(auth.isAuthenticated ? '/links' : '/login'), {
  replace: true,
})
</script>

<template>
  <div />
</template>
