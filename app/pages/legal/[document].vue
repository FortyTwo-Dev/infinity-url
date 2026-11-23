<script setup lang="ts">
import {
  LEGAL_DOCUMENTS,
  isLegalSlug,
} from '~/lib/legal/fr'

definePageMeta({ layout: 'public', public: true })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const entry = computed(() => {
  const slug = String(route.params.document ?? '')

  return isLegalSlug(slug) ? LEGAL_DOCUMENTS[slug] : null
})

if (entry.value === null) {
  throw createError({ statusCode: 404, fatal: true })
}

const formattedDate = computed(() => {
  const date = entry.value?.updatedAt ?? ''

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
})

const showEnglishNotice = computed(() => locale.value === 'en')

useSeoMeta({
  title: () => entry.value?.title ?? '',
  description: () => entry.value?.sections[0]?.paragraphs[0] ?? '',
  robots: 'index, follow',
})

// The document is French even on /en/legal/*: the notice is translated, the
// text is not. The page therefore declares French, and the notice declares
// English on its own element.
useHead({
  htmlAttrs: { lang: 'fr' },
})
</script>

<template>
  <div v-if="entry" class="public-page legal-page">
    <p
      v-if="showEnglishNotice"
      class="legal-notice it-small"
      lang="en"
      role="note"
    >
      {{ t('legal.englishNotice') }}
    </p>

    <h1 class="it-h1">
      {{ entry.title }}
    </h1>

    <p class="it-small it-muted">
      {{ t('legal.updated', { date: formattedDate }) }}
    </p>

    <section
      v-for="section in entry.sections"
      :key="section.heading"
      class="legal-section"
    >
      <h2 class="it-h2">
        {{ section.heading }}
      </h2>
      <p
        v-for="(paragraph, index) in section.paragraphs"
        :key="index"
        class="it-p"
      >
        {{ paragraph }}
      </p>
    </section>

    <p class="it-small">
      <NuxtLink :to="localePath('/')" class="it-link-accent">
        {{ t('legal.back') }}
      </NuxtLink>
    </p>
  </div>
</template>
