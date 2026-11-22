import { apiBlob } from '~/lib/api/client'

/** Fetch the CSV with the Bearer, then trigger a local download. */
export async function downloadStatsCsv(
  linkId: string,
  query: URLSearchParams,
): Promise<void> {
  const { blob, filename } = await apiBlob(
    `/links/${encodeURIComponent(linkId)}/stats.csv?${query.toString()}`,
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename ?? `stats-${linkId}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
