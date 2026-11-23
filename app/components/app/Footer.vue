<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const legalLinks = [
  { slug: 'notice', label: 'legal.nav.notice' },
  { slug: 'terms', label: 'legal.nav.terms' },
  { slug: 'aup', label: 'legal.nav.aup' },
  { slug: 'privacy', label: 'legal.nav.privacy' },
  { slug: 'subcontractors', label: 'legal.nav.subcontractors' },
  { slug: 'client-clause', label: 'legal.nav.clientClause' },
] as const
</script>

<template>
  <footer class="app-footer">
    <nav class="app-footer__legal" :aria-label="t('legal.nav.aria')">
      <NuxtLink
        v-for="item in legalLinks"
        :key="item.slug"
        :to="localePath(`/legal/${item.slug}`)"
        class="it-small it-link-accent"
      >
        {{ t(item.label) }}
      </NuxtLink>
      <NuxtLink :to="localePath('/abuse')" class="it-small it-link-accent">
        {{ t('abuse.page.title') }}
      </NuxtLink>
      <NuxtLink :to="localePath('/report')" class="it-small it-link-accent">
        {{ t('abuse.page.reportCta') }}
      </NuxtLink>
    </nav>

    <div class="app-footer__meta">
      <span class="it-small it-muted">{{ t('app.name') }}</span>
      <a
        class="it-small it-link-accent"
        href="https://github.com/FortyTwo-Dev/infinity-url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('nav.source') }}
      </a>
    </div>
  </footer>
</template>
