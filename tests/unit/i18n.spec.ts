import fr from '~~/i18n/locales/fr.json'
import en from '~~/i18n/locales/en.json'
import { describe, expect, it } from 'vitest'

type Catalog = { [key: string]: string | Catalog }

function flatten(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`

    return typeof value === 'string' ? [path] : flatten(value, path)
  })
}

describe('i18n catalogs', () => {
  it('exposes the same keys in French and English', () => {
    const french = flatten(fr as Catalog).sort()
    const english = flatten(en as Catalog).sort()

    expect(english).toEqual(french)
  })

  it('has no empty label', () => {
    const french = flatten(fr as Catalog)
    const english = flatten(en as Catalog)

    for (const key of french) {
      const value = key.split('.').reduce<unknown>(
        (current, part) =>
          typeof current === 'object' && current !== null
            ? (current as Record<string, unknown>)[part]
            : undefined,
        fr as unknown as Catalog,
      )

      expect(value, key).toBeTypeOf('string')
      expect((value as string).trim(), key).not.toBe('')
    }

    expect(english).toHaveLength(french.length)
  })
})
