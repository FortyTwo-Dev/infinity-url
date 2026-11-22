<script setup lang="ts">
definePageMeta({ layout: 'public', public: true })

const { t } = useI18n()
const route = useRoute()

const initialSlug = computed(() =>
  typeof route.query.slug === 'string' ? route.query.slug : '',
)

useSeoMeta({
  title: () => t('abuse.report.title'),
  description: () => t('abuse.report.subtitle'),
  robots: 'index, follow',
})
</script>

<template>
  <div class="public-page">
    <section class="public-main__intro">
    <h1 class="it-h1">
      {{ t('abuse.report.title') }}
    </h1>
    <p class="it-lead">
      {{ t('abuse.report.subtitle') }}
    </p>
  </section>

  <AbuseReportForm :initial-slug="initialSlug" />

  <p class="it-small it-muted">
    {{ t('abuse.report.responseTime') }}
  </p>
  </div>
</template>
