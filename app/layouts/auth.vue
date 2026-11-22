<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="auth-shell">
    <div class="auth-panel">
      <header class="auth-header">
        <NuxtLink :to="localePath('/')" class="app-brand">
          {{ t('app.name') }}
        </NuxtLink>
        <div class="auth-header__actions">
          <AppLocaleSwitcher />
          <AppThemeToggle />
        </div>
      </header>

      <main class="auth-card">
        <slot />
      </main>

      <AppFooter />
    </div>
  </div>
</template>
