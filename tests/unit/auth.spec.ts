import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { configureApi, configureAuth } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'
import { useAuthStore } from '~/stores/auth'

const BASE_URL = 'https://api.test/v1'

const USER = {
  id: 'u1',
  email: 'a@b.c',
  email_verified: true,
  totp_enabled: false,
}

const ME = {
  user: USER,
  workspace: {
    id: 'w1',
    name: 'Espace',
    plan: 'free',
    limits: {
      active_links: 5,
      custom_domains: 0,
      stats_retention_days: 30,
    },
  },
  capabilities: ['links:read', 'links:write', 'stats:read', 'qr'],
}

let fetchMock: ReturnType<typeof vi.fn>
let store: ReturnType<typeof useAuthStore>

beforeEach(() => {
  setActivePinia(createPinia())
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  store = useAuthStore()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function tokenResponse(accessToken: string) {
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 900,
    user: USER,
  }
}

function configureTestApi(): void {
  configureApi({ baseUrl: BASE_URL })
  configureAuth({
    getToken: () => store.accessToken,
    refresh: () => store.refreshSession(),
  })
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function problemResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json' },
  })
}

function requestUrl(index = 0): string {
  const call = fetchMock.mock.calls[index]
  if (!call) {
    throw new Error(`fetch was not called at index ${index}`)
  }

  const input: unknown = call[0]
  if (typeof input === 'string') {
    return input
  }
  if (typeof input === 'object' && input !== null && 'url' in input) {
    return String((input as { url: unknown }).url)
  }

  return String(input)
}

function requestInit(index = 0): RequestInit {
  const call = fetchMock.mock.calls[index]
  if (!call) {
    throw new Error(`fetch was not called at index ${index}`)
  }

  return (call[1] ?? {}) as RequestInit
}

function headersOf(init: RequestInit): Record<string, string> {
  const headers = init.headers
  if (!headers) {
    return {}
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(
      headers.map(([key, value]) => [String(key).toLowerCase(), String(value)]),
    ) as Record<string, string>
  }

  if (typeof (headers as Headers).entries === 'function') {
    const record: Record<string, string> = {}
    for (const [key, value] of (headers as Headers).entries()) {
      record[key.toLowerCase()] = value
    }

    return record
  }

  return Object.fromEntries(
    Object.entries(headers as Record<string, string>).map(([key, value]) => [
      key.toLowerCase(),
      String(value),
    ]),
  )
}

function headerValue(init: RequestInit, name: string): string | undefined {
  return headersOf(init)[name.toLowerCase()]
}

function bodyOf(init: RequestInit): unknown {
  if (typeof init.body !== 'string') {
    return undefined
  }

  return JSON.parse(init.body) as unknown
}

async function captureRejection(promise: Promise<unknown>): Promise<ApiProblem> {
  try {
    await promise
  } catch (error) {
    return error as ApiProblem
  }

  throw new Error('The call was expected to reject but resolved.')
}

async function signIn(accessToken = 'access-1'): Promise<void> {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(tokenResponse(accessToken)))
    .mockResolvedValueOnce(jsonResponse(ME))

  await store.login({ email: 'a@b.c', password: 'secret' })
}

describe('auth store', () => {
  describe('login', () => {
    it('authenticates on a login without 2FA and exposes the session', async () => {
      configureTestApi()

      fetchMock
        .mockResolvedValueOnce(jsonResponse(tokenResponse('access-1')))
        .mockResolvedValueOnce(jsonResponse(ME))

      await store.login({ email: 'a@b.c', password: 'secret' })

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(requestUrl(0)).toBe(`${BASE_URL}/auth/login`)
      expect(requestInit(0).method).toBe('POST')
      expect(headerValue(requestInit(0), 'authorization')).toBeUndefined()
      expect(bodyOf(requestInit(0))).toEqual({ email: 'a@b.c', password: 'secret' })
      expect(requestUrl(1)).toBe(`${BASE_URL}/me`)
      expect(headerValue(requestInit(1), 'authorization')).toBe('Bearer access-1')

      expect(store.status).toBe('authenticated')
      expect(store.isAuthenticated).toBe(true)
      expect(store.accessToken).toBe('access-1')
      expect(store.user?.email).toBe('a@b.c')
      expect(store.emailVerified).toBe(true)
      expect(store.workspace?.id).toBe('w1')
      expect(store.capabilities).toContain('links:read')
      expect(store.can('qr')).toBe(true)
      expect(store.can('tokens:write')).toBe(false)
    })

    it('returns the 2FA challenge without storing a token, then verifies the code', async () => {
      configureTestApi()

      fetchMock.mockResolvedValueOnce(
        jsonResponse({ status: 'totp_required', challenge: 'ch-1' }),
      )

      const result = await store.login({ email: 'a@b.c', password: 'secret' })

      expect(result).toEqual({ totpRequired: true, challenge: 'ch-1' })
      expect(store.status).not.toBe('authenticated')
      expect(store.accessToken).toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(headerValue(requestInit(0), 'authorization')).toBeUndefined()

      fetchMock.mockReset()
      fetchMock
        .mockResolvedValueOnce(jsonResponse(tokenResponse('access-2fa')))
        .mockResolvedValueOnce(jsonResponse(ME))

      await store.verifyTotp('ch-1', '123456')

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(requestUrl(0)).toBe(`${BASE_URL}/auth/2fa/verify`)
      expect(headerValue(requestInit(0), 'authorization')).toBeUndefined()
      expect(bodyOf(requestInit(0))).toEqual({ challenge: 'ch-1', code: '123456' })
      expect(store.status).toBe('authenticated')
      expect(store.accessToken).toBe('access-2fa')
      expect(store.user?.email).toBe('a@b.c')
    })
  })

  describe('bootstrap', () => {
    it('restores the session from the refresh cookie and loads the user', async () => {
      configureTestApi()

      fetchMock
        .mockResolvedValueOnce(jsonResponse(tokenResponse('access-boot')))
        .mockResolvedValueOnce(jsonResponse(ME))

      await store.bootstrap()

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(requestUrl(0)).toBe(`${BASE_URL}/auth/refresh`)
      expect(requestInit(0).method).toBe('POST')
      expect(headerValue(requestInit(0), 'authorization')).toBeUndefined()
      expect(requestUrl(1)).toBe(`${BASE_URL}/me`)
      expect(store.status).toBe('authenticated')
      expect(store.accessToken).toBe('access-boot')
      expect(store.user?.email).toBe('a@b.c')
      expect(store.capabilities).toContain('stats:read')
    })

    it('becomes anonymous on a refused refresh and never calls /me', async () => {
      configureTestApi()

      fetchMock.mockResolvedValueOnce(
        problemResponse({ status: 401, code: 'unauthorized', title: 'Unauthorized' }, 401),
      )

      await store.bootstrap()

      expect(store.status).toBe('anonymous')
      expect(store.isAuthenticated).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(requestUrl(0)).toBe(`${BASE_URL}/auth/refresh`)
    })
  })

  describe('refreshSession', () => {
    it('shares a single refresh between concurrent callers', async () => {
      configureTestApi()

      let resolveRefresh: (response: Response) => void = () => {}
      const pending = new Promise<Response>((resolve) => {
        resolveRefresh = resolve
      })
      fetchMock.mockReturnValue(pending)

      const first = store.refreshSession()
      const second = store.refreshSession()
      const third = store.refreshSession()

      resolveRefresh(jsonResponse(tokenResponse('access-single')))

      await expect(Promise.all([first, second, third])).resolves.toEqual([true, true, true])
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(store.accessToken).toBe('access-single')
    })
  })

  describe('logout', () => {
    it('clears the session on a successful logout', async () => {
      configureTestApi()
      await signIn()

      fetchMock.mockReset()
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

      await store.logout()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(requestUrl(0)).toBe(`${BASE_URL}/auth/logout`)
      expect(requestInit(0).method).toBe('POST')
      expect(headerValue(requestInit(0), 'authorization')).toBeUndefined()
      expect(store.status).toBe('anonymous')
      expect(store.isAuthenticated).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.workspace).toBeNull()
      expect(store.capabilities).toEqual([])
    })

    it('keeps the session and rethrows when the logout is refused', async () => {
      configureTestApi()
      await signIn()

      fetchMock.mockReset()
      fetchMock.mockResolvedValueOnce(
        problemResponse({ status: 500, code: 'server_error', title: 'Server error' }, 500),
      )

      const problem = await captureRejection(store.logout())

      expect(problem).toBeInstanceOf(ApiProblem)
      expect(problem.status).toBe(500)
      expect(store.status).toBe('authenticated')
      expect(store.accessToken).toBe('access-1')
      expect(store.user?.email).toBe('a@b.c')
    })
  })

  describe('clear', () => {
    it('empties the token, the user, the workspace and the capabilities', async () => {
      configureTestApi()
      await signIn()

      expect(store.capabilities.length).toBeGreaterThan(0)

      store.clear()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.workspace).toBeNull()
      expect(store.capabilities).toEqual([])
      expect(store.status).toBe('anonymous')
      expect(store.isAuthenticated).toBe(false)
    })
  })
})
