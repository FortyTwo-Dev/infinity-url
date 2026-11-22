import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const localePath = useLocalePath()

  // Public pages never touch the session: /report and /abuse are rendered on
  // the server, with no API request and no cookie. The dashboard keeps its
  // in-memory token and its redirect to /login.
  if (to.meta.public === true) {
    if (import.meta.server || to.meta.guestOnly !== true) {
      return
    }

    await auth.bootstrap()

    if (auth.isAuthenticated) {
      return navigateTo(localePath('/links'))
    }

    return
  }

  await auth.bootstrap()

  if (!auth.isAuthenticated) {
    return navigateTo(localePath('/login'))
  }

  const capability = to.meta.capability

  if (
    typeof capability === 'string'
    && !auth.can(capability)
  ) {
    throw createError({ statusCode: 403, fatal: true })
  }
})
