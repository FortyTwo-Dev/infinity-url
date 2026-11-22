<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { LinkItem } from '~/stores/links'

definePageMeta({ capability: 'links:write' })

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()

function created(link: LinkItem): void {
  void navigateTo(localePath(`/links/${link.id}`))
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1 class="it-h1">
          {{ t('links.create.title') }}
        </h1>
        <p class="it-lead">
          {{ t('links.create.subtitle') }}
        </p>
      </div>
      <NuxtLink :to="localePath('/links')" class="it-link-accent">
        {{ t('links.detail.backToLinks') }}
      </NuxtLink>
    </header>

    <EmailVerificationBanner v-if="!auth.emailVerified" />

    <LinkCreateForm @created="created" />
  </section>
</template>
