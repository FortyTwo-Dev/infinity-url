export function useIntlLocale() {
  const { locale } = useI18n()

  return computed(() => (locale.value === 'en' ? 'en-GB' : 'fr-FR'))
}
