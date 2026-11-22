/**
 * RFC 9457 problem details, as returned by the API under
 * `application/problem+json`. The `detail` field is English and is never shown
 * to the user: the UI translates the stable `code`.
 */
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  code: string
  errors?: Record<string, string[]>
}

export class ApiProblem extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly errors: Record<string, string[]> = {},
    readonly retryAfter: number | null = null,
  ) {
    super(code)
    this.name = 'ApiProblem'
  }
}

/**
 * Read a failed response into an ApiProblem. A body that is not a problem
 * document maps to `server_error`, never to a leaked HTML page.
 */
export async function parseProblem(response: Response): Promise<ApiProblem> {
  const retryAfter = readRetryAfter(response)
  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const body = isRecord(payload) ? payload : {}
  const code =
    typeof body.code === 'string' && body.code !== ''
      ? body.code
      : 'server_error'

  return new ApiProblem(
    code,
    response.status,
    readErrors(body.errors),
    retryAfter,
  )
}

function readRetryAfter(response: Response): number | null {
  const raw = response.headers.get('retry-after')

  if (raw === null || raw.trim() === '') {
    return null
  }

  const seconds = Number.parseInt(raw, 10)

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

function readErrors(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) {
    return {}
  }

  const errors: Record<string, string[]> = {}

  for (const [field, messages] of Object.entries(value)) {
    if (!Array.isArray(messages)) {
      continue
    }

    const strings = messages.filter(
      (message): message is string => typeof message === 'string',
    )

    if (strings.length > 0) {
      errors[field] = strings
    }
  }

  return errors
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
