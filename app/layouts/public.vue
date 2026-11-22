<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="public-shell">
    <header class="public-header">
      <div class="public-header__inner">
        <NuxtLink :to="localePath('/')" class="app-brand">
          {{ t('app.name') }}
        </NuxtLink>
        <div class="public-header__actions">
          <AppLocaleSwitcher />
          <AppThemeToggle />
        </div>
      </div>
    </header>

    <main class="public-main">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
