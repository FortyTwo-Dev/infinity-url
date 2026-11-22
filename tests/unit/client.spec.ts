import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiBlob, apiRequest, apiUrl, configureApi, configureAuth } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'

const BASE_URL = 'https://api.test/v1'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

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

function problemResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json', ...headers },
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

async function captureRejection(promise: Promise<unknown>): Promise<ApiProblem> {
  try {
    await promise
  } catch (error) {
    return error as ApiProblem
  }

  throw new Error('The request was expected to reject but resolved.')
}

describe('apiUrl', () => {
  it('joins the base URL and the path with a single slash', () => {
    configureApi({ baseUrl: BASE_URL })

    expect(apiUrl('/links')).toBe(`${BASE_URL}/links`)

    configureApi({ baseUrl: `${BASE_URL}/` })
    expect(apiUrl('/links')).toBe(`${BASE_URL}/links`)

    configureApi({ baseUrl: BASE_URL })
    expect(apiUrl('links')).toBe(`${BASE_URL}/links`)
  })
})

describe('apiRequest', () => {
  it('sends the bearer token and includes credentials on an authenticated request', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: 'u1' } }))

    const data = await apiRequest('/me')

    expect(data).toEqual({ user: { id: 'u1' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestUrl()).toBe(`${BASE_URL}/me`)
    expect(requestInit().method ?? 'GET').toBe('GET')
    expect(headerValue(requestInit(), 'authorization')).toBe('Bearer token-1')
    expect(requestInit().credentials).toBe('include')
  })

  it('sends no Authorization header when auth is false', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: 'a@b.c', password: 'secret' },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(headerValue(requestInit(), 'authorization')).toBeUndefined()
    expect(headerValue(requestInit(), 'content-type')).toBe('application/json')
    expect(requestInit().credentials).toBe('include')
  })

  it('turns a problem+json response into an ApiProblem without leaking detail', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })

    const detail = 'The slug "promo" is reserved for internal use.'
    fetchMock.mockResolvedValueOnce(
      problemResponse(
        {
          type: 'https://api.test/problems/slug-taken',
          title: 'Conflict',
          status: 409,
          detail,
          code: 'slug_taken',
          errors: { slug: ['The slug is already taken.'] },
        },
        409,
      ),
    )

    const problem = await captureRejection(apiRequest('/links', { method: 'POST' }))

    expect(problem).toBeInstanceOf(ApiProblem)
    expect(problem.code).toBe('slug_taken')
    expect(problem.status).toBe(409)
    expect(problem.errors).toEqual({ slug: ['The slug is already taken.'] })
    expect(problem.retryAfter).toBeNull()
    expect(problem.message).not.toContain(detail)
    expect(problem.message).not.toContain('reserved for internal use')
  })

  it('reads Retry-After in whole seconds', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })

    fetchMock.mockResolvedValueOnce(
      problemResponse(
        {
          type: 'https://api.test/problems/rate-limited',
          title: 'Too Many Requests',
          status: 429,
          code: 'rate_limited',
        },
        429,
        { 'retry-after': '12' },
      ),
    )

    const problem = await captureRejection(apiRequest('/links'))

    expect(problem).toBeInstanceOf(ApiProblem)
    expect(problem.code).toBe('rate_limited')
    expect(problem.status).toBe(429)
    expect(problem.retryAfter).toBe(12)
  })

  it('refreshes once on 401 and replays the request once with the new token', async () => {
    configureApi({ baseUrl: BASE_URL })

    let token = 'token-1'
    const refresh = vi.fn(async () => {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return false
      }

      token = 'token-2'
      return true
    })
    configureAuth({ getToken: () => token, refresh })

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'unauthorized', status: 401 }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'token-2', token_type: 'Bearer', expires_in: 900 }),
      )
      .mockResolvedValueOnce(jsonResponse({ user: { id: 'u1' } }))

    const data = await apiRequest('/me')

    expect(data).toEqual({ user: { id: 'u1' } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(requestUrl(0)).toBe(`${BASE_URL}/me`)
    expect(requestUrl(1)).toBe(`${BASE_URL}/auth/refresh`)
    expect(requestInit(1).method).toBe('POST')
    expect(requestUrl(2)).toBe(`${BASE_URL}/me`)
    expect(headerValue(requestInit(2), 'authorization')).toBe('Bearer token-2')
  })

  it('rejects with unauthorized when the refresh is refused, without replaying', async () => {
    configureApi({ baseUrl: BASE_URL })

    const refresh = vi.fn(async () => false)
    configureAuth({ getToken: () => 'token-1', refresh })

    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 'unauthorized', status: 401 }, 401))

    const problem = await captureRejection(apiRequest('/me'))

    expect(problem).toBeInstanceOf(ApiProblem)
    expect(problem.code).toBe('unauthorized')
    expect(problem.status).toBe(401)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects with network_error when fetch itself fails', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const problem = await captureRejection(apiRequest('/me'))

    expect(problem).toBeInstanceOf(ApiProblem)
    expect(problem.code).toBe('network_error')
    expect(problem.status).toBe(0)
  })
})

describe('apiBlob', () => {
  it('returns the blob and the filename from Content-Disposition', async () => {
    configureApi({ baseUrl: BASE_URL })
    configureAuth({ getToken: () => 'token-1', refresh: vi.fn() })

    fetchMock.mockResolvedValueOnce(
      new Response('slug,clicks\nabc,3\n', {
        status: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="stats-abc.csv"',
        },
      }),
    )

    const result = await apiBlob('/links/abc/stats.csv')

    expect(result.filename).toBe('stats-abc.csv')
    expect(result.blob.size).toBeGreaterThan(0)
    expect(result.blob.type).toBe('text/csv')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestUrl()).toBe(`${BASE_URL}/links/abc/stats.csv`)
    expect(headerValue(requestInit(), 'authorization')).toBe('Bearer token-1')
    expect(requestInit().credentials).toBe('include')
  })
})
