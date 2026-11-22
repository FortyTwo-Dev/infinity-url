<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav class="locale-switcher" :aria-label="t('nav.language')">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      :to="switchLocalePath(item.code)"
      class="it-nav-link"
      :aria-current="item.code === locale ? 'page' : undefined"
    >
      {{ item.name }}
    </NuxtLink>
  </nav>
</template>
