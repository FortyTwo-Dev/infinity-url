import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const localePath = useLocalePath()

  await auth.bootstrap()

  if (!auth.isAuthenticated && to.meta.public !== true) {
    return navigateTo(localePath('/login'))
  }

  if (auth.isAuthenticated && to.meta.guestOnly === true) {
    return navigateTo(localePath('/links'))
  }

  const capability = to.meta.capability

  if (
    auth.isAuthenticated
    && typeof capability === 'string'
    && !auth.can(capability)
  ) {
    throw createError({ statusCode: 403, fatal: true })
  }
})
