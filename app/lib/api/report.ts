import { ApiProblem, parseProblem } from './problem'
import { apiUrl } from './client'

export type ReportCategory = 'phishing' | 'malware' | 'other'

export interface ReportInput {
  slug: string
  category: ReportCategory
  details?: string
  email?: string
  /** Honeypot: always empty for a human. */
  website?: string
}

export interface ReportReceipt {
  reference: string
  status: string
}

/**
 * The report is anonymous: no bearer, no refresh, no cookie. `credentials:
 * 'omit'` is explicit because the shared client sends the refresh cookie by
 * default, and a reporter must never receive one.
 */
export async function submitReport(input: ReportInput): Promise<ReportReceipt> {
  let response: Response

  try {
    response = await fetch(apiUrl('/report'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'omit',
      body: JSON.stringify(input),
    })
  } catch {
    throw new ApiProblem('network_error', 0)
  }

  if (!response.ok) {
    throw await parseProblem(response)
  }

  return (await response.json()) as ReportReceipt
}
