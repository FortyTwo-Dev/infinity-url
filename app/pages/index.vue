<script setup lang="ts">
definePageMeta({ layout: 'public', public: true })

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t('marketing.meta.title'),
  description: () => t('marketing.meta.description'),
  robots: 'index, follow',
})
</script>

<template>
  <div class="public-page marketing-page">
    <section class="public-main__intro">
      <h1 class="it-h1">
        {{ t('marketing.hero.title') }}
      </h1>
      <p class="it-lead">
        {{ t('marketing.hero.subtitle') }}
      </p>
      <div class="marketing-actions">
        <NuxtLink :to="localePath('/signup')" class="it-btn it-btn-primary">
          {{ t('marketing.hero.signup') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/login')" class="it-btn it-btn-secondary">
          {{ t('marketing.hero.login') }}
        </NuxtLink>
      </div>
    </section>

    <section class="public-card">
      <h2 class="it-h2">
        {{ t('marketing.product.title') }}
      </h2>
      <p class="it-p">
        {{ t('marketing.product.body') }}
      </p>
      <ol class="marketing-steps">
        <li>{{ t('marketing.product.step1') }}</li>
        <li>{{ t('marketing.product.step2') }}</li>
        <li>{{ t('marketing.product.step3') }}</li>
      </ol>
    </section>

    <section class="public-card">
      <h2 class="it-h2">
        {{ t('marketing.privacy.title') }}
      </h2>
      <ul class="marketing-list">
        <li>{{ t('marketing.privacy.noCookie') }}</li>
        <li>{{ t('marketing.privacy.noIp') }}</li>
        <li>{{ t('marketing.privacy.noClickRow') }}</li>
        <li>{{ t('marketing.privacy.aggregated') }}</li>
        <li>{{ t('marketing.privacy.qr') }}</li>
        <li>{{ t('marketing.privacy.noThirdParty') }}</li>
      </ul>
    </section>

    <section class="public-card">
      <h2 class="it-h2">
        {{ t('marketing.offer.title') }}
      </h2>
      <p class="it-p">
        {{ t('marketing.offer.body') }}
      </p>
      <p class="it-p">
        {{ t('marketing.offer.sla') }}
      </p>
    </section>

    <section class="public-card">
      <h2 class="it-h2">
        {{ t('marketing.links.title') }}
      </h2>
      <div class="marketing-links">
        <NuxtLink :to="localePath('/report')" class="it-link-accent">
          {{ t('marketing.links.report') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/abuse')" class="it-link-accent">
          {{ t('marketing.links.abuse') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/legal/notice')" class="it-link-accent">
          {{ t('marketing.links.notice') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/legal/privacy')" class="it-link-accent">
          {{ t('marketing.links.privacy') }}
        </NuxtLink>
        <a
          class="it-link-accent"
          href="https://github.com/FortyTwo-Dev/infinity-url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('marketing.links.source') }}
        </a>
      </div>
    </section>
  </div>
</template>
