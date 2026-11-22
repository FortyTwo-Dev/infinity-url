import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { configureApi } from '~/lib/api/client'
import { submitReport } from '~/lib/api/report'
import { ApiProblem } from '~/lib/api/problem'

const BASE_URL = 'https://api.test/v1'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  configureApi({ baseUrl: BASE_URL })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function requestInit(): RequestInit {
  const call = fetchMock.mock.calls[0]

  if (!call) {
    throw new Error('fetch was not called')
  }

  return call[1] as RequestInit
}

function requestUrl(): string {
  return String(fetchMock.mock.calls[0]?.[0])
}

describe('submitReport', () => {
  it('posts to the public endpoint without credentials', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reference: '01JD3K8YQ4X7M2V9R5T1B6N0C3', status: 'received' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const receipt = await submitReport({
      slug: 'abc123',
      category: 'phishing',
      website: '',
    })

    expect(receipt.status).toBe('received')
    expect(requestUrl()).toBe(`${BASE_URL}/report`)
    expect(requestInit().credentials).toBe('omit')
    expect(requestInit().method).toBe('POST')

    const headers = requestInit().headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(JSON.parse(String(requestInit().body))).toEqual({
      slug: 'abc123',
      category: 'phishing',
      website: '',
    })
  })

  it('maps a failed response to an ApiProblem with its stable code', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 'rate_limited', title: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/problem+json', 'retry-after': '3600' },
      }),
    )

    await expect(
      submitReport({ slug: 'abc123', category: 'phishing' }),
    ).rejects.toMatchObject({ code: 'rate_limited', status: 429, retryAfter: 3600 })
  })

  it('maps a transport failure to network_error', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    await expect(
      submitReport({ slug: 'abc123', category: 'phishing' }),
    ).rejects.toBeInstanceOf(ApiProblem)
  })
})
