import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'
import type { operations } from '~~/types/api'

export type MeResponse =
  operations['me.show']['responses'][200]['content']['application/json']
export type MeWorkspace = MeResponse['workspace']
export type SessionStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous'

/** The email is nullable in the login payload, never in `GET /me`. */
export interface SessionUser {
  id: string
  email: string | null
  email_verified: boolean
  totp_enabled: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginOutcome {
  totpRequired: boolean
  challenge: string | null
}

interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user: SessionUser
}

interface RefreshResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

type LoginResponse =
  | TokenResponse
  | { status: 'totp_required'; challenge: string | null }

/**
 * The access token lives in this store only, in memory. No persistence, no
 * cookie written by JavaScript.
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const status = ref<SessionStatus>('unknown')
  const user = ref<SessionUser | null>(null)
  const workspace = ref<MeWorkspace | null>(null)
  const capabilities = ref<string[]>([])

  const isAuthenticated = computed(() => status.value === 'authenticated')
  const emailVerified = computed(() => user.value?.email_verified === true)

  let refreshPromise: Promise<boolean> | null = null
  let bootstrapPromise: Promise<void> | null = null

  async function refreshSession(): Promise<boolean> {
    refreshPromise ??= doRefresh().finally(() => {
      refreshPromise = null
    })

    return refreshPromise
  }

  async function doRefresh(): Promise<boolean> {
    try {
      const data = await apiRequest<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        auth: false,
        retry: false,
      })

      if (typeof data?.access_token !== 'string' || data.access_token === '') {
        clear()

        return false
      }

      accessToken.value = data.access_token

      return true
    } catch (error) {
      if (
        error instanceof ApiProblem
        && (error.status === 401 || error.status === 403)
      ) {
        clear()
      }

      return false
    }
  }

  async function bootstrap(): Promise<void> {
    if (status.value !== 'unknown') {
      return
    }

    bootstrapPromise ??= doBootstrap().finally(() => {
      bootstrapPromise = null
    })

    return bootstrapPromise
  }

  async function doBootstrap(): Promise<void> {
    status.value = 'loading'

    try {
      if (await refreshSession()) {
        await loadMe()

        return
      }

      clear()
    } catch {
      clear()
    }
  }

  async function login(credentials: LoginCredentials): Promise<LoginOutcome> {
    const data = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false,
    })

    if ('status' in data) {
      return { totpRequired: true, challenge: data.challenge }
    }

    accessToken.value = data.access_token
    user.value = data.user
    await loadMe()

    return { totpRequired: false, challenge: null }
  }

  async function verifyTotp(challenge: string, code: string): Promise<void> {
    await verify('/auth/2fa/verify', { challenge, code })
  }

  async function verifyRecoveryCode(
    challenge: string,
    recoveryCode: string,
  ): Promise<void> {
    await verify('/auth/2fa/verify', {
      challenge,
      recovery_code: recoveryCode,
    })
  }

  async function verify(
    path: string,
    body: Record<string, string>,
  ): Promise<void> {
    const data = await apiRequest<TokenResponse>(path, {
      method: 'POST',
      body,
      auth: false,
    })

    accessToken.value = data.access_token
    user.value = data.user
    await loadMe()
  }

  async function loadMe(): Promise<void> {
    try {
      const data = await apiRequest<MeResponse>('/me')

      user.value = data.user
      workspace.value = data.workspace
      capabilities.value = data.capabilities
      status.value = 'authenticated'
    } catch (error) {
      if (error instanceof ApiProblem && error.status === 401) {
        clear()
      }

      throw error
    }
  }

  async function logout(): Promise<void> {
    await apiRequest<undefined>('/auth/logout', {
      method: 'POST',
      auth: false,
      retry: false,
    })

    clear()
  }

  function clear(): void {
    accessToken.value = null
    user.value = null
    workspace.value = null
    capabilities.value = []
    status.value = 'anonymous'
  }

  function can(capability: string): boolean {
    return capabilities.value.includes(capability)
  }

  return {
    accessToken,
    status,
    user,
    workspace,
    capabilities,
    isAuthenticated,
    emailVerified,
    refreshSession,
    bootstrap,
    login,
    verifyTotp,
    verifyRecoveryCode,
    loadMe,
    logout,
    clear,
    can,
  }
})
