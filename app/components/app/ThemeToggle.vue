<script setup lang="ts">
import { useTheme } from '~/lib/theme/theme'

const { theme, toggleTheme } = useTheme()
const { t } = useI18n()

const label = computed(() =>
  theme.value === 'dark' ? t('theme.toLight') : t('theme.toDark'),
)
</script>

<template>
  <button
    type="button"
    class="it-btn it-btn-ghost it-btn-sm it-btn-icon theme-toggle"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <svg
      v-if="theme === 'dark'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  </button>
</template>
