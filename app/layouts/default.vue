<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const { message } = useProblemMessage()

const pending = ref(false)
const logoutError = ref<string | null>(null)

async function signOut(): Promise<void> {
  pending.value = true
  logoutError.value = null

  try {
    await auth.logout()
    await navigateTo(localePath('/login'))
  } catch (error) {
    logoutError.value = message(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <NuxtLink :to="localePath('/links')" class="app-brand">
          {{ t('app.name') }}
        </NuxtLink>

        <nav
          v-if="auth.can('links:read')"
          class="app-nav"
          :aria-label="t('nav.links')"
        >
          <NuxtLink :to="localePath('/links')" class="it-nav-link">
            {{ t('nav.links') }}
          </NuxtLink>
        </nav>

        <div class="app-header__meta">
          <span v-if="auth.workspace" class="it-small it-muted">
            {{ auth.workspace.name }}
          </span>
          <AppLocaleSwitcher />
          <AppThemeToggle />
          <ItButton
            variant="secondary"
            size="sm"
            :loading="pending"
            @click="signOut"
          >
            {{ t('nav.logout') }}
          </ItButton>
        </div>
      </div>

      <p v-if="logoutError" class="it-field-error" role="alert">
        {{ logoutError }}
      </p>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
