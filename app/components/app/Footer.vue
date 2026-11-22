<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="app-footer">
    <span class="it-small it-muted">{{ t('app.name') }}</span>
    <a
      class="it-small it-link-accent"
      href="https://github.com/FortyTwo-Dev/infinity-url"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t('nav.source') }}
    </a>
  </footer>
</template>
