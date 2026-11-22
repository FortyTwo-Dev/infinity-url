import { ApiProblem, parseProblem } from './problem'

export interface ApiAuthHandlers {
  getToken: () => string | null
  refresh: () => Promise<boolean>
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  /** Attach the Bearer and retry once after a refresh. Defaults to true. */
  auth?: boolean
  /** Retry once after a successful refresh. Defaults to true. */
  retry?: boolean
  signal?: AbortSignal
  headers?: Record<string, string>
}

export interface BlobResponse {
  blob: Blob
  filename: string | null
}

let baseUrl = '/v1'
let authHandlers: ApiAuthHandlers = {
  getToken: () => null,
  refresh: async () => false,
}

export function configureApi(options: { baseUrl: string }): void {
  baseUrl = options.baseUrl

  while (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }
}

export function configureAuth(handlers: ApiAuthHandlers): void {
  authHandlers = handlers
}

export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${suffix}`
}

export function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return send<T>(path, options, false)
}

export function apiBlob(
  path: string,
  options: RequestOptions = {},
): Promise<BlobResponse> {
  return send<BlobResponse>(path, options, true)
}

async function send<T>(
  path: string,
  options: RequestOptions,
  asBlob: boolean,
): Promise<T> {
  const auth = options.auth !== false
  const retry = options.retry !== false
  const token = auth ? authHandlers.getToken() : null
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (options.body !== undefined && !hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = 'application/json'
  }

  if (token !== null && token !== '') {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(apiUrl(path), {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch {
    throw new ApiProblem('network_error', 0)
  }

  if (response.status === 401 && auth && retry) {
    const refreshed = await authHandlers.refresh()

    if (refreshed) {
      return send<T>(path, { ...options, retry: false }, asBlob)
    }

    throw new ApiProblem('unauthorized', 401)
  }

  if (!response.ok) {
    throw await parseProblem(response)
  }

  if (asBlob) {
    return {
      blob: await response.blob(),
      filename: parseFilename(response.headers.get('content-disposition')),
    } as T
  }

  return readJson<T>(response)
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const text = await response.text()

  if (text === '') {
    return undefined as T
  }

  return JSON.parse(text) as T
}

function parseFilename(header: string | null): string | null {
  if (header === null) {
    return null
  }

  const match = /filename="?([^";]+)"?/i.exec(header)

  return match?.[1] ?? null
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some((key) => key.toLowerCase() === name)
}
