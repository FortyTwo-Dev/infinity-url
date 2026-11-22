<script setup lang="ts">
definePageMeta({ layout: 'public', public: true })

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t('abuse.page.title'),
  description: () => t('abuse.page.subtitle'),
  robots: 'index, follow',
})
</script>

<template>
  <div class="public-page">
    <section class="public-main__intro">
    <h1 class="it-h1">
      {{ t('abuse.page.title') }}
    </h1>
    <p class="it-lead">
      {{ t('abuse.page.subtitle') }}
    </p>
  </section>

  <section class="public-card">
    <h2 class="it-h2">
      {{ t('abuse.page.procedureTitle') }}
    </h2>

    <ol class="abuse-steps">
      <li>
        <strong>{{ t('abuse.page.step1Title') }}</strong>
        {{ t('abuse.page.step1Body') }}
      </li>
      <li>
        <strong>{{ t('abuse.page.step2Title') }}</strong>
        {{ t('abuse.page.step2Body') }}
      </li>
      <li>
        <strong>{{ t('abuse.page.step3Title') }}</strong>
        {{ t('abuse.page.step3Body') }}
      </li>
      <li>
        <strong>{{ t('abuse.page.step4Title') }}</strong>
        {{ t('abuse.page.step4Body') }}
      </li>
    </ol>
  </section>

  <section class="public-card">
    <h2 class="it-h2">
      {{ t('abuse.page.contactTitle') }}
    </h2>
    <p class="it-p">
      {{ t('abuse.page.contactBody') }}
    </p>
    <p class="it-p">
      <a class="abuse-contact it-link-accent" href="mailto:abuse@iurl.fr">abuse@iurl.fr</a>
    </p>
    <p class="it-p">
      {{ t('abuse.page.reportBody') }}
    </p>
    <NuxtLink :to="localePath('/report')" class="it-link-accent">
      {{ t('abuse.page.reportCta') }}
    </NuxtLink>
  </section>

  <section class="public-card">
    <h2 class="it-h2">
      {{ t('abuse.page.dsaTitle') }}
    </h2>
    <p class="it-p">
      {{ t('abuse.page.dsaBody') }}
    </p>
    <p class="it-p">
      {{ t('abuse.page.dsaMonitoring') }}
    </p>
  </section>
  </div>
</template>
