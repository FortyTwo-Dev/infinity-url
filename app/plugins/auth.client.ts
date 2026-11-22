import { configureApi, configureAuth } from '~/lib/api/client'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  configureApi({ baseUrl: config.public.apiBase })
  configureAuth({
    getToken: () => auth.accessToken,
    refresh: () => auth.refreshSession(),
  })
})
