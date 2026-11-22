import { ApiProblem } from '~/lib/api/problem'

export function useProblemMessage() {
  const { t, te } = useI18n()

  function codeMessage(code: string): string {
    const key = `errors.codes.${code}`

    return te(key) ? t(key) : t('errors.codes.unknown')
  }

  function fieldMessage(field: string): string {
    const key = `errors.fields.${field}`

    return te(key) ? t(key) : t('errors.codes.validation_failed')
  }

  function message(error: unknown): string {
    if (error instanceof ApiProblem) {
      return codeMessage(error.code)
    }

    return t('errors.codes.network_error')
  }

  return { codeMessage, fieldMessage, message }
}
